document.addEventListener('DOMContentLoaded', function () {
    const json = {
        'addresses': ['Air Township'],
        'message': 'Transcribe Success!',
        'process_time_seconds': 0.72,
        'segments': [{
            'end': 23.3,
            'segment_id': 1,
            'start': 16.66,
            'text': [
                {
                    'end': 17.22, 'start': 16.66, 'word': ' Terry', 'word_id': 1
                },
                {
                    'end': 17.78,
                    'start': 17.22,
                    'word': ' Township,',
                    'word_id': 2
                },
                {
                    'end': 18.42, 'start': 18.0, 'word': ' in', 'word_id': 3
                },
                {
                    'end': 18.52,
                    'start': 18.42,
                    'word': ' the',
                    'word_id': 4
                },
                {'end': 18.72, 'start': 18.52, 'word': ' area', 'word_id': 5
                },
                {
                    'end': 18.9,
                    'start': 18.72,
                    'word': ' of',
                    'word_id': 6
                },
                {
                    'end': 19.18, 'start': 18.9, 'word': ' Route', 'word_id': 7
                },
                {
                    'end': 20.12,
                    'start': 19.18,
                    'word': ' 187',
                    'word_id': 8
                },
                {
                    'end': 20.54, 'start': 20.12, 'word': ' and', 'word_id': 9
                },
                {
                    'end': 21.36,
                    'start': 20.54,
                    'word': ' Johnson',
                    'word_id': 10
                },
                {
                    'end': 21.8, 'start': 21.36, 'word': ' Road,', 'word_id': 11
                },
                {
                    'end': 22.06,
                    'start': 21.88,
                    'word': ' one',
                    'word_id': 12
                },
                {
                'end': 22.44, 'start': 22.06, 'word': ' carport', 'word_id': 13
                },
                {
                    'end': 22.64,
                    'start': 22.44,
                    'word': ' of',
                    'word_id': 14
                },
                {
                'end': 22.72, 'start': 22.64, 'word': ' a', 'word_id': 15
                },
                {
                    'end': 23.0,
                    'start': 22.72,
                    'word': ' flag',
                    'word_id': 16
                },
                {
                'end': 23.3, 'start': 23.0, 'word': ' today.', 'word_id': 17
                }
            ]
        }],
        'status': 'ok',
        'transcription': 'Air Township, in the area of Route 187 and Johnson Road, one carport of a flag today.'
    };

    const transcriptDiv = document.getElementById('transcript');
    json.segments.forEach(segment => {
        segment.words.forEach(wordInfo => {
            const span = document.createElement('span');
            span.dataset.start = wordInfo.start;
            span.dataset.end = wordInfo.end;
            span.textContent = wordInfo.word + ' ';
            transcriptDiv.appendChild(span);
        });
    });

    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.addEventListener('timeupdate', function () {
        const currentTime = this.currentTime;
        document.querySelectorAll('#transcript span').forEach(span => {
            const start = parseFloat(span.dataset.start);
            const end = parseFloat(span.dataset.end);
            if (currentTime >= start && currentTime <= end) {
                span.classList.add('highlight');
            } else {
                span.classList.remove('highlight');
            }
        });
    });

});