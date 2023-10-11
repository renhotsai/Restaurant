/*
document.addEventListener("DOMContentLoaded", function () {
  // Select the buttons with the "add-to-cart-button" class
  const addButtons = document.querySelectorAll(".product button");

  // Select the popup container
  const popup = document.getElementById("popup");

  // Attach a click event listener to each "Add to Cart" button
  addButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      // Prevent the default behavior of the button
      event.preventDefault();

      // Show the popup container
      popup.style.display = "block";
    });
  });

  // Close the popup when clicking outside the container
  document.addEventListener("click", function (event) {
    if (event.target === popup) {
      popup.style.display = "none";
    }
  });

  // Prevent clicks inside the popup from closing it
  popup.addEventListener("click", function (event) {
    event.stopPropagation();
  });
});
*/