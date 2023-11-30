document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM is ready!");

    const chatContainer = document.getElementById("chat-container");
    const userInput = document.getElementById("user-input");

    function appendMessage(message, isSystem) {
        const messageText = isSystem ? ` ${message}` : ` ${message}`;
        const messageParagraph = document.createElement("p");
        messageParagraph.textContent = messageText;
        messageParagraph.className = isSystem ? "system-message" : "user-response";

        chatContainer.insertBefore(messageParagraph, userInput);

        const lastMessage = document.querySelector("#chat-container p:last-child");
        if (lastMessage) {
            lastMessage.classList.add("success-message");
        }
    }

    function handleUserResponse(response) {
        // Handle user responses based on your logic
        // For example, you can call a function to process the response
        processUserResponse(response);
    }

    function processUserResponse(response) {
        // Implement your logic to process the user's response
        // You can adapt the logic from the example you provided
        // For now, let's append the user's response to the chat
        appendMessage(response, false);

        // Clear the input field after processing the response
        userInput.value = "";

        // Scroll to the bottom of the chat
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    userInput.addEventListener("keyup", function(event) {
        if (event.key === "Enter" || event.key === "Return") {
            event.preventDefault();
            const response = userInput.value.trim();
            if (response !== "") {
                appendMessage(response, false);
                handleUserResponse(response);
            }
        }
    });

    // Initial system message
    appendMessage("Welcome! Let's get started.", true);

    // You can start the conversation or ask the first question here
    // For example:
    // appendMessage("Please enter your name:", true);

    // This is just an example; you can customize the conversation flow based on your needs
});
