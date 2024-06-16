export class QueueManager {
    constructor() {
        this.pendingQueue = []; // Queue for pending files to be played
        this.playedFiles = []; // Array to keep the last 5 played files
    }

    addToQueue(item) {
        console.log("Adding Track To Audio Queue")
        this.pendingQueue.push(item);
    }

    getNext() {
        // When retrieving the next item, move it from pendingQueue to playedFiles
        return this.pendingQueue.shift();
    }

    addToPlayedFiles(item) {
        this.playedFiles.unshift(item);
        // Ensure only the last 5 items are kept
        if (this.playedFiles.length > 5) {
            this.playedFiles.pop(); // Removes the oldest item
        }
    }

    peek() {
        return this.pendingQueue[0];
    }

    clearQueue() {
        this.pendingQueue = [];
    }

    clearPlayedFiles() {
        this.playedFiles = [];
    }

    isEmpty() {
        return this.pendingQueue.length === 0;
    }

    getQueueSize() {
        return this.pendingQueue.length;
    }

    getPlayedFiles() {
        return this.playedFiles;
    }

    // Optionally, you might want to reintroduce played files back into the queue
    reintroducePlayedFile(item) {
        this.addToQueue(item);
    }
}