document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM is ready!");

    // Function to display prompts and gather user information
    function gatherInformation() {
        var name = prompt("Please enter your name:");
        var email = prompt("Please enter your email:");
        var phone = prompt("Please enter your phone number:");

        // Validate email format
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Invalid email format. Please enter a valid email address.");
            return;
        }

        // Validate phone number format
        var phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            alert("Invalid phone number format. Please enter a 10-digit phone number.");
            return;
        }

        // Ask for proof of purchase with file type restrictions
        var proofOfPurchase = prompt("Please upload proof of purchase (only .jpeg and .pdf files are accepted):");
        var fileExtension = proofOfPurchase.substring(proofOfPurchase.lastIndexOf('.') + 1).toLowerCase();

        if (fileExtension !== "jpeg" && fileExtension !== "pdf") {
            alert("Invalid file type. Only .jpeg and .pdf files are accepted.");
            return;
        }

        // Display gathered information
        alert("Name: " + name + "\nEmail: " + email + "\nPhone: " + phone + "\nProof of Purchase: " + proofOfPurchase);
    }

    // Get the button element using its id
    var button = document.getElementById('infoButton');

    // Add an event listener to the button
    button.addEventListener('click', gatherInformation);
});