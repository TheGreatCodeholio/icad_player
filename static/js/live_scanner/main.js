import { Scanner } from './scanner.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application once the DOM is fully loaded
    const app = new Scanner();

    // If there are any actions you need to perform right after the app starts, you can do them here.
    // For example, if you want to automatically load some initial data or check the state of certain resources.

    // app.initialize() or similar initialization methods could be called here if you've defined them in your App class.
    // This is also a good place to register service workers, set up global event listeners, or handle routing if needed.
});