// snowfall.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("Snowfall script is running!");
    // Number of snowflakes
    const numberOfSnowflakes = 50;

    // Create snowflakes
    for (let i = 0; i < numberOfSnowflakes; i++) {
        createSnowflake();
    }

    function createSnowflake() {
        const snowflake = document.createElement("div");
        snowflake.className = "snowflake";
        document.body.appendChild(snowflake);

        const startPosition = Math.random() * window.innerWidth;
        const fallDuration = Math.random() * 5 + 5; // Vary the fall duration for a more natural look

        snowflake.style.left = startPosition + "px";
        snowflake.style.animationDuration = fallDuration + "s";

        snowflake.addEventListener("animationiteration", () => {
            // Reset snowflake when it reaches the bottom
            snowflake.style.left = Math.random() * window.innerWidth + "px";
            snowflake.style.animationDuration = Math.random() * 5 + 5 + "s";
        });
    }
});
