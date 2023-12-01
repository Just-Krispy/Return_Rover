document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM is ready!");

    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');

    // Start the conversation by asking for the user's name
    askQuestion('Please enter your name:');

    // User information object to store responses
    const userInfo = {
        name: '',
        email: '',
        phone: '',
        proofOfPurchase: ''
    };

    // Function to display system prompts and gather user information
    function askQuestion(question) {
        // Remove previous system prompts
        const systemMessages = document.querySelectorAll('.system-message');
        systemMessages.forEach(message => message.remove());

        // Append the current system prompt
        appendMessage('system-message', question, true);
    }

    // Function to handle user responses
    function handleUserResponse() {
        // Get the user's response from the userInput element
        const response = userInput.value.trim();

        // Check if the response is not empty
        if (response !== '') {
            // Log user responses to the console (you can replace this with further processing)
            console.log('User response:', response);

            // Update user information based on the current question
            if (!userInfo.name) {
                // Validate name format (First Name, Last Name)
                const nameParts = response.split(' ');
                if (nameParts.length === 2 && nameParts[0] && nameParts[1]) {
                    userInfo.name = response;
                    // Display user's response after processing
                    appendMessage('user-message', response);
                    askQuestion('Great! Now, please enter your email:');
                } else {
                    // Invalid name format, ask again
                    askQuestion('Invalid name format. Please enter your full name (First Name Last Name):');
                }
            } else if (!userInfo.email) {
                // Validate email format (you can enhance the validation if needed)
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(response)) {
                    userInfo.email = response;
                    // Display user's response after processing
                    appendMessage('user-message', response);
                    askQuestion('Thanks! Now, please enter your phone number:');
                } else {
                    // Invalid email format, ask again
                    askQuestion('Invalid email format. Please enter a valid email address:');
                }
            } else if (!userInfo.phone) {
                // Validate phone number format (10 digits) and format it
                const phoneRegex = /^\d{10}$/;
                if (phoneRegex.test(response)) {
                    userInfo.phone = formatPhoneNumber(response);
                    // Display user's response after processing
                    appendMessage('user-message', response);
                    askQuestion('Thanks! Please upload proof of purchase (only .jpeg and .pdf files are accepted):');
                } else {
                    // Invalid phone number format, ask again
                    askQuestion('Invalid phone number format. Please enter a 10-digit phone number:');
                }
            } else if (!userInfo.proofOfPurchase) {
                // Validate file type (you can enhance the validation if needed)
                const fileExtension = response.substring(response.lastIndexOf('.') + 1).toLowerCase();
                if (fileExtension === 'jpeg' || fileExtension === 'pdf') {
                    userInfo.proofOfPurchase = response;
                    // Display user's response after processing
                    appendMessage('user-message', response);
                    // End of information gathering, display gathered information
                    displayUserInfo();
                } else {
                    // Invalid file type, ask again
                    askQuestion('Invalid file type. Please upload only .jpeg and .pdf files:');
                }
            }

            // Clear the userInput for the next input
            userInput.value = '';
        }
    }

    // Function to display gathered user information
    function displayUserInfo() {
        // Remove previous system prompts
        const systemMessages = document.querySelectorAll('.system-message');
        systemMessages.forEach(message => message.remove());

        // Remove previous user inputs
        const userMessages = document.querySelectorAll('.user-message');
        userMessages.forEach(message => message.remove());

        // Display gathered user information
        appendMessage('system-message', 'Thank you! Here is the information we gathered:');
        appendMessage('user-message', 'Name: ' + userInfo.name);
        appendMessage('user-message', 'Email: ' + userInfo.email);
        appendMessage('user-message', 'Phone: ' + userInfo.phone);
        appendMessage('user-message', 'Proof of Purchase: ' + userInfo.proofOfPurchase);
        // You can add further logic or actions based on the gathered information
    }

    // Event listener for user input
    userInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleUserResponse();
        }
    });

    // Function to append messages to the chat container
    function appendMessage(className, message, prepend = false) {
        const messageElement = document.createElement('p');
        messageElement.className = className;
        messageElement.textContent = message;

        if (prepend) {
            chatContainer.insertBefore(messageElement, chatContainer.firstChild);
        } else {
            chatContainer.appendChild(messageElement);
        }

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Function to format phone number as (XXX) XXX-XXXX
    function formatPhoneNumber(phone) {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return phone;
    }
});
