import uuid

from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

listener_count = 0


# Home page that will display the audio player
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/test_format')
def test_format():
    return render_template('transmission_format.html')


@app.route('/test_highlight')
def test_highlight():
    return render_template('test_highlight.html')


@app.route('/test_caption')
def test_caption():
    return render_template('test_caption.html')


@app.route('/test_player')
def test_player():
    return render_template('test_player_gui.html')


@app.route('/test_player_js')
def test_player_js():
    return render_template('old_index.html')


@app.route('/streaming')
def streaming():
    return render_template('streaming.html')

# Endpoint to receive the JSON file with the audio URL
@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    data = request.get_json()
    call_id = uuid.uuid4()
    audio_url = data.get('audio_m4a_url')
    data["id"] = str(call_id)
    if audio_url:
        # Broadcast the audio URL to all clients
        socketio.emit('new_audio', data)
        print(data)
        return {'message': 'Audio URL received and broadcasted.'}, 200
    else:
        return {'message': 'No audio URL provided.'}, 400


@socketio.on('connect')
def handle_connect():
    print('Client connected')
    user_id = request.sid  # For simplicity, using the session ID as the user ID
    global listener_count
    listener_count += 1
    print(f"Listener count: {listener_count}")
    socketio.emit('listener_count', listener_count)


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')
    user_id = request.sid
    global listener_count
    listener_count -= 1
    print(f"Listener count: {listener_count}")
    socketio.emit('listener_count', listener_count)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8003)
