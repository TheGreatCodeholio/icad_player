function showAlert(message, type) {
    // Create the alert div
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.role = 'alert';
    alertDiv.textContent = message;

    // Append the alert div to the alert list
    const alertList = document.getElementById('alert_list');
    alertList.appendChild(alertDiv);

    // Remove the alert after 30 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 30000); // 30000 milliseconds = 30 seconds
}

async function queryURL(url, method = "GET", query_params = null, body = null) {
    try {
        let headers = {};

        // Determine the type of the body to set the correct Content-Type header
        if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
            if (body instanceof FormData) {
                // If the body is FormData, let the browser set the Content-Type header
                // to multipart/form-data; boundary=----WebKitFormBoundary...
                // Do not set Content-Type header manually
                // headers['Content-Type'] = 'multipart/form-data'; // This line is intentionally commented out
            } else {
                // For JSON data
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(body); // Convert body object to JSON string
            }
        }

        if (query_params) {
            // Assuming query_params is an object. Convert object to query string
            let queryParamsString = new URLSearchParams(query_params).toString();
            url += '?' + queryParamsString; // Append query string to URL
        }

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: method !== "GET" && method !== "DELETE" ? body : null, // Include the body for POST, PUT, PATCH requests
        });

        return await response.json(); // This will be wrapped in a promise
    } catch (error) {
        return {"success": false, "message": error.toString(), "result": []};
    }
}