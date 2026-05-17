import asyncio
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
import threading
import socketio
from mavsdk import System
import sys
import time

# Configuration - Target the Mac Backend dynamically
SERVER_URL = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.1.7:3001"
DRONE_ID = "VX-99"
PI_IP = "192.168.1.15"

# List of common Pixhawk serial ports on Raspberry Pi
SERIAL_PORTS = ["/dev/ttyUSB0", "/dev/ttyACM0", "/dev/ttyAMA0"]
BAUD_RATE = 57600

sio = socketio.AsyncClient()
STREAMING_ACTIVE = False

# --- ULTRA-STABLE CAMERA SERVER ---
class VideoHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global STREAMING_ACTIVE
        
        if STREAMING_ACTIVE:
            self.send_error(429, "Stream Busy")
            return

        print(f"🎬 [PI] Dashboard connected. Starting Camera...")
        STREAMING_ACTIVE = True
        
        try:
            self.send_response(200)
            self.send_header('Content-type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            cmd = ["rpicam-vid", "-t", "0", "--inline", "--width", "640", "--height", "480", "--framerate", "20", "--codec", "mjpeg", "-n", "-o", "-"]
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=0)

            while True:
                data = process.stdout.read(4096)
                if not data: break
                self.wfile.write(b"--frame\r\n")
                self.wfile.write(b"Content-Type: image/jpeg\r\n\r\n")
                self.wfile.write(data)
                self.wfile.write(b"\r\n")
        except Exception as e:
            print(f"🎬 [PI] Stream disconnected: {e}")
        finally:
            STREAMING_ACTIVE = False
            if 'process' in locals():
                process.terminate()

    def log_message(self, format, *args): return

class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    allow_reuse_address = True

def run_video_server():
    print(f"📸 Camera Link listening at http://{PI_IP}:8080")
    server = ThreadedHTTPServer(('0.0.0.0', 8080), VideoHandler)
    server.serve_forever()

# --- TELEMETRY BRIDGE ---
async def main():
    print(f"🔗 [NETWORK] Connecting to Server at {SERVER_URL}...")
    try:
        await sio.connect(SERVER_URL)
        print("✅ Dashboard Link Established")
        await sio.emit('register_drone', {"id": DRONE_ID})
    except Exception as e:
        print(f"❌ [NETWORK] Failed to connect to server: {e}")
        return

    threading.Thread(target=run_video_server, daemon=True).start()

    drone = System()
    connected = False
    
    print(f"📡 Scanning for Pixhawk hardware...")
    for port in SERIAL_PORTS:
        print(f"  -> Testing {port}...")
        try:
            await asyncio.wait_for(drone.connect(system_address=f"serial://{port}:{BAUD_RATE}"), timeout=5)
            # Verify connection by getting an ID
            async for state in drone.core.connection_state():
                if state.is_connected:
                    connected = True
                    print(f"🛸 {DRONE_ID} ONLINE on {port}")
                    break
            if connected: break
        except Exception:
            continue

    if not connected:
        print("⚠️ HARDWARE ERROR: Pixhawk not found on any port. Ensure USB/UART is plugged in.")
        return

    # Unified Telemetry Loop
    async def track_telemetry():
        battery_task = asyncio.create_task(get_battery(drone))
        position_task = asyncio.create_task(get_position(drone))
        heading_task = asyncio.create_task(get_heading(drone))
        await asyncio.gather(battery_task, position_task, heading_task)

    async def get_battery(drone_sys):
        async for b in drone_sys.telemetry.battery():
            await sio.emit('drone-telemetry', {"id": DRONE_ID, "battery": int(b.remaining_percent * 100)})

    async def get_position(drone_sys):
        async for p in drone_sys.telemetry.position():
            await sio.emit('drone-telemetry', {"id": DRONE_ID, "lat": p.latitude_deg, "lng": p.longitude_deg, "alt": p.relative_altitude_m})

    async def get_heading(drone_sys):
        async for h in drone_sys.telemetry.heading():
            speed = 0 # Placeholder for GPS speed calculation if needed
            await sio.emit('drone-telemetry', {"id": DRONE_ID, "speed": speed})

    asyncio.create_task(track_telemetry())

    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
