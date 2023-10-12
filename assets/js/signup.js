const changeForm = () => {
    const userType = document.querySelector('input[name="user"]:checked');
    if (userType && userType.value === "CUSTOMER") {
        const customers = document.getElementsByClassName("customer");
        for (const customer of customers) {
            customer.style.display = "flex";
        }
        const drivers = document.getElementsByClassName("driver");
        for (const driver of drivers) {
            driver.style.display = "none";
        }
    } else {
        const customers = document.getElementsByClassName("customer");
        for (const customer of customers) {
            customer.style.display = "none";
        }
        const drivers = document.getElementsByClassName("driver");
        for (const driver of drivers) {
            driver.style.display = "flex";
        }
    }
};