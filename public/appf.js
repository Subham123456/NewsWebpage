
function handleNavigation() {
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
  
      // Remove "active" class from all navigation links
      navLinks.forEach(link => link.classList.remove('active'));
  
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
  
      targetSection.scrollIntoView({
        behavior: 'smooth'
      });
  
      // Add "active" class to the clicked navigation link
      link.classList.add('active');
    });
  });
}

handleNavigation();

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');

  searchButton.addEventListener('click', function() {
    const keyword = searchInput.value.toLowerCase();

    // Filter the news articles based on the keyword and display the results
    const filteredArticles = newsArticles.filter(function(article) {
      return article.title.toLowerCase().includes(keyword) ||
        article.description.toLowerCase().includes(keyword);
    });

    displayNewsArticles(filteredArticles);
  });
});

function displayNewsArticles(articles) {
  const newsContainer = document.getElementById('news-container');

  // Clear existing content
  newsContainer.innerHTML = '';

  // Loop through the articles and generate HTML elements
  articles.forEach(function(article) {
    const articleElement = document.createElement('div');
    articleElement.classList.add('article');

    const titleElement = document.createElement('h2');
    titleElement.textContent = article.title;

    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = article.description;

    articleElement.appendChild(titleElement);
    articleElement.appendChild(descriptionElement);

    newsContainer.appendChild(articleElement);
  });
}

 function fetchNewsData() {
    fetch('./newsdata.json')
    .then(response => response.json()).then(data=>{
        const newsContainer = document.querySelector('#news-container');
  
        data.forEach(article => {
          const articleElement = document.createElement('div');

          articleElement.innerHTML = `
          <h2>${article.title}</h2>
          <p>${article.description}</p>
          <p>Author: ${article.author}</p>
          <p>Published At: ${article.date}</p>
          `
          newsContainer.appendChild(articleElement)
        });
      })
      .catch(error => {
        // Handle any errors that occurred during the fetch
        console.error('Error:', error);
      });
  }
  
fetchNewsData();

document.addEventListener('DOMContentLoaded', function() {
  const subscriptionForm = document.getElementById('subscription-form');

  subscriptionForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email-input');
    const email = emailInput.value;

    // Perform validation or other actions with the email value

    // Reset the form
    subscriptionForm.reset();
  });
});