export class SocketManager {
    constructor({io, onNewAudioCallback, onListenerCountCallback}) {
        this.socket = io(); // Assuming 'socket' is initialized and passed correctly
        this.initListeners();
        this.onNewAudioCallback = onNewAudioCallback;
        this.onListenerCallback = onListenerCountCallback;
    }

    initListeners() {
        // Connect to backend Socket.IO
        console.log('Init Socket Listeners')

        this.socket.on('connect', () => {
            console.log('Socket IO connected');
            this.connected = true; // Update connected status
        });

        this.socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            this.connected = false; // Update connected status
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
            this.connected = true;
        });

        // Setup event listeners for incoming socket events
        this.socket.on('new_audio', (audioMetadata) => {
            console.log('Received new audio data:', audioMetadata);
            this.onNewAudioCallback(audioMetadata);
        });

        this.socket.on('listener_count', (data) => {
            console.log('Received listener count data:', data);
            this.onListenerCallback(data)
        });

        // Handle errors
        this.socket.on('connect_error', (error) => {
            console.error('Connection Error:', error);
            // Handle connection error (e.g., retry connection, notify user)
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection Error:', error);
            // Handle reconnection error
        });

        this.socket.on('error', (error) => {
            console.error('General Error:', error);
            // Handle general error
        });
    }

    // Method to emit messages with error handling
    emitEvent(event, data) {
        if (this.socket) {
            try {
                this.socket.emit(event, data);
            } catch (error) {
                console.error(`Error emitting ${event}`, error);
                // Handle emit error (e.g., retry emit, notify user)
            }
        } else {
            console.error('Socket is not initialized');
            // Handle case where socket is not initialized
        }
    }

    isConnected() {
        return this.socket && this.socket.connected; // Directly return the socket's connected status
    }

}