export class AudioDataManager {
    constructor() {

    }

    checkTones(audioData) {

        if (Array.isArray(audioData.tones) && audioData.tones.length === 0) {
            return false;
        }

        for (let key in audioData.tones) {
            // Ensure the property belongs to the object and is not inherited
            if (audioData.tones.hasOwnProperty(key)) {
                // Check if the property is an array and not empty
                if (Array.isArray(audioData.tones[key]) && audioData.tones[key].length > 0) {
                    return true; // Return true if any array within the object is not empty
                }
            }
        }

        // Return false if 'tones' does not exist in the object
        return false;
    }
}

