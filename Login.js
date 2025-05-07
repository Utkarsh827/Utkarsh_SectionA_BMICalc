// Function to handle the login validation and redirection
function handleLoginAttempt() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput.value;
    const password = passwordInput.value;

    // --- IMPORTANT SECURITY WARNING ---
    // Storing credentials directly in client-side JavaScript is INSECURE.
    // This is ONLY for demonstration or very simple, non-sensitive scenarios.
    // Real applications MUST validate credentials on a server.
    const correctUsername = 'user';      // Replace 'user' with your desired username
    const correctPassword = 'password123'; // Replace 'password123' with your desired password

    if (username === correctUsername && password === correctPassword) {
        // --- SUCCESS ---
        alert('Login successful! Redirecting...');
        // Redirect to BMI.html
        window.location.href = 'BMI.html';
        // No need to return anything specific here as redirection takes over
    } else {
        // --- FAILURE ---
        alert('Invalid username or password. Please try again.');
        // Optional: Clear the fields for the user
        passwordInput.value = '';
        // Optional: Set focus back to the username field
        usernameInput.focus();
        // We already prevented default submission, so nothing more needed here
    }
}

// Wait for the HTML document to be fully loaded before attaching the event listener
document.addEventListener('DOMContentLoaded', (event) => {
    const loginForm = document.getElementById('loginForm'); // Make sure your form has id="loginForm"

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // VERY IMPORTANT: Prevent the default form submission behavior
            e.preventDefault();

            // Call the function that handles validation and redirection
            handleLoginAttempt();
        });
    } else {
        console.error("Login form with ID 'loginForm' not found!");
    }
});
