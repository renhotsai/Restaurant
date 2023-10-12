document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("popup");
  if (popup) {
    // Prevent clicks inside the popup from closing it
    document
      .querySelector(".add-to-order-container")
      .addEventListener("click", function (event) {
        event.stopPropagation();
      });

    // close when clicked on cancel button
    document
      .getElementById("popup-btn")
      .addEventListener("click", function (event) {
        popup.style.display = "none";
      });

    // Set "Medium" radio button as default
    const sizeRadio = popup.querySelector(
      'input[type="radio"][value="Medium"]'
    );
    if (sizeRadio) {
      sizeRadio.checked = true;
    }

    // Close the popup when clicking outside the container
    popup.addEventListener("click", function (event) {
      if (event.target === popup) {
        popup.style.display = "none";
      }
    });

    const checkboxes = popup.querySelectorAll("input[type=checkbox");
    const maxToppings = 5; // Maximum allowed toppings
    let selectedToppings = 0;

    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].addEventListener("change", function () {
        if (this.checked) {
          selectedToppings++;
          if (selectedToppings > maxToppings) {
            this.checked = false;
            selectedToppings--;
          }
        } else {
          selectedToppings--;
        }
      });
    }

    // for calculation
    const subTotalElement = document.getElementById("sub-total");
    const taxElement = document.getElementById("tax");
    const totalElement = document.getElementById("total");

    const sizeRadios = [
      document.querySelector('input[type="radio"][name="size"][value="Small"]'),
      document.querySelector(
        'input[type="radio"][name="size"][value="Medium"]'
      ),
      document.querySelector('input[type="radio"][name="size"][value="Large"]'),
      document.querySelector(
        'input[type="radio"][name="size"][value="Extra Large"]'
      ),
    ];

    const toppingsCheckboxes = popup.querySelectorAll(
      'input[type="checkbox"][name="toppings"]'
    );

    const calculateTotal = () => {
      const taxRate = 0.13; // Adjust the tax rate as needed
      let subTotal = 0;
      let selectedToppings = 0;

      for (let i = 0; i < sizeRadios.length; i++) {
        if (sizeRadios[i].checked) {
          subTotal += parseFloat(sizeRadios[i].getAttribute("data-price"));
        }
      }

      for (let i = 0; i < toppingsCheckboxes.length; i++) {
        if (toppingsCheckboxes[i].checked && selectedToppings < 5) {
          subTotal += parseFloat(
            toppingsCheckboxes[i].getAttribute("data-price")
          );
          selectedToppings++;
        }
        if (selectedToppings >= 5) {
          break;
        }
      }

      const tax = subTotal * taxRate;
      const total = subTotal + tax;

      subTotalElement.textContent = subTotal.toFixed(2);
      taxElement.textContent = tax.toFixed(2);
      totalElement.textContent = total.toFixed(2);
    };

    for (let i = 0; i < sizeRadios.length; i++) {
      sizeRadios[i].addEventListener("change", calculateTotal);
    }

    for (let i = 0; i < toppingsCheckboxes.length; i++) {
      toppingsCheckboxes[i].addEventListener("change", calculateTotal);
    }

    // Initialize the total on page load
    calculateTotal();


    // code before here
  }
});
