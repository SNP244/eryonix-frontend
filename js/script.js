document.addEventListener("DOMContentLoaded", function () {
    
    initializeSearchAndFilter();
});

// Function to initialize search and category filtering
function initializeSearchAndFilter() {
    const searchInput = document.getElementById("search-input");
    const talentCards = document.querySelectorAll(".talent-card");

    if (!searchInput || talentCards.length === 0) return; 

    // Search Functionality
    searchInput.addEventListener("input", function () {
        let searchValue = searchInput.value.toLowerCase();
        talentCards.forEach(card => {
            let title = card.querySelector("h4").innerText.toLowerCase();
            let description = card.querySelector("p").innerText.toLowerCase();
            let match = title.includes(searchValue) || description.includes(searchValue);

            card.style.opacity = match ? "1" : "0";
            card.style.display = match ? "block" : "none";
        });
    });

    // Category Filter Functionality
    const categoryButtons = document.querySelectorAll(".category-btn");

    categoryButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault(); 
            let category = button.getAttribute("data-category");

            talentCards.forEach(card => {
                let cardCategory = card.getAttribute("data-category");
                let match = (cardCategory === category || category === "all");

                card.style.transition = "opacity 0.3s ease-in-out";
                card.style.opacity = match ? "1" : "0";
                setTimeout(() => {
                    card.style.display = match ? "block" : "none";
                }, 300);
            });
        });
    });
}
