
/*---Identifier code*---*/
const idForm = document.querySelector('.idForm');
idForm.addEventListener('submit',assingID);
const idInput = document.querySelector('#idInput');

var myID;
function assingID(e){
    e.preventDefault();
    myID = idInput.value;
    updateMovieWatch().then();
}



/*---Movie Browsing and Add---*/

let currentSearchedMovies = []; 
let selectedMovies = [];

const movieInput = document.querySelector('.searchMovie');
movieInput.addEventListener('submit',searchMovie); //has to be on the form item

const movieInputSearch = document.querySelector('#movieNameInput');

//searched for movie, enter in the input box
async function searchMovie(e){
    e.preventDefault();
    const movieTitle = movieInputSearch.value;
    await addMovie(movieTitle);
}


//add the movie and trigger getting new images
async function addMovie(title){
    currentSearchedMovies.length = 0;
    const movieJson = await getMovie(title);
    if (movieJson.Response == 'False'){
        movieInputSearch.value = 'NOT A VALID MOVIE';
        return;
    };
    movieJson.Search.forEach(movie=>currentSearchedMovies.push(movie));
    for (let i=0; i<currentSearchedMovies.length;i++){
        const rawData = await fetch(`/movieInfo/${currentSearchedMovies[i].imdbID}`);
        const movieData = await rawData.json();
        currentSearchedMovies[i] = movieData;
    }
    updateImage();
}


//search movie
async function getMovie(title){
    const response = await fetch(`/getMovie/${title}`);
    const movieData = await response.json();
    return movieData;

}


//add movie pictures
const movieList = document.querySelector('.movieList');
function updateImage(){
    // currentSearchedMovies
    movieList.innerHTML = '';

    for (let i=0;i<currentSearchedMovies.length;i++){
        let imageUrl = currentSearchedMovies[i].Poster;
        const movieName = currentSearchedMovies[i].Title;
    
        if (imageUrl == 'N/A'){
            imageUrl = './assets/not_found.jpg'
        }
    
        const movieImage = document.createElement('img');
        movieImage.classList.add('movieImage');
        movieImage.src = imageUrl;
    
        const description = document.createElement('div');
        description.classList.add('description');


        const movieTitle = document.createElement('p');
        movieTitle.classList.add('movieName');
        movieTitle.textContent = movieName;

        const movieContain = document.createElement('div');
        movieContain.classList.add('theMovie');

        const movieSelect = document.createElement('input');
        movieSelect.type = 'checkbox';
        movieSelect.classList.add('movieSelect');


        movieContain.append(movieImage);
        description.append(movieTitle);
        description.append(movieSelect);
        movieContain.append(description);

        movieList.append(movieContain);
    }
   


}



/*---To Watch List---*/

const textEntry = document.querySelector('#toWatchComment');
const newEntry = document.querySelector('.newEntry');
const myWatchList = document.querySelector('#myWatchList');
newEntry.addEventListener('submit',submitToDatabase);


//Add past added movies
async function updateMovieWatch(){

    const rawData = await fetch (`/getDatabase/${myID}`);
    const movieNodeList = await rawData.json();
    const allMovies = Array.from(movieNodeList);
    
    if (document.querySelector('.watchItem p')){
        const existingMovie = document.querySelector('.watchItem p').textContent;
        if ((existingMovie!= null && allMovies.length != 0) || existingMovie != '[Your Movie Here] Comments:'){
            myWatchList.innerHTML = '';
        }
    }

    for (let i=0; i<allMovies.length;i++){
        
        const myWatchItem = document.createElement('li');
        myWatchItem.classList.add('watchItem');
    
        const watchItemName = document.createElement('p');
        watchItemName.textContent = '[' + allMovies[i].movie.Title + '] (' +  allMovies[i].movie.Year + ') Thoughts: ' +  allMovies[i].comments;

        const checkButtons = document.createElement("SPAN");
        checkButtons.textContent = "\u2713"
        checkButtons.classList.add('checkButton')
        checkButtons.addEventListener('click',addWatched)

        if (allMovies[i].meta.watched){
            myWatchItem.classList.add('watched');
        }

        myWatchItem.append(watchItemName);
        myWatchItem.append(checkButtons);
        myWatchList.append(myWatchItem);

    }
}


//ToWatch List, check or uncheck movie
async function addWatched(){
  
  const entry = this.parentNode.childNodes[0].textContent;
  const movieName = entry.substring(entry.indexOf('[')+1,entry.lastIndexOf(']'));

  const targetObj = {movieName};

  if (this.parentNode.classList.contains('watched')){
    const response = await sendData(targetObj, '/uncheckMovie');
    console.log(response); //tell if successful or not
  }
  else{
    const response = await sendData(targetObj, '/checkMovie');
    console.log(response); //tell if successful or not
  }
  
  this.parentNode.classList.toggle('watched');

}


//submit to to watch list and database
async function submitToDatabase(e){
    e.preventDefault();
    let selectedMovies = findCheckMovie();
    addToList(selectedMovies);


    //object contain info of if movie watched (to do list is checked or not)
    const metaObj = {
        watched: false,
        user_id: myID||'n/a',
    }

    //send the movie data
    for (let i=0; i<selectedMovies.length;i++){
        const movieObj = {
            movie: selectedMovies[i],
            comments: textEntry.value,
            meta: metaObj,
        }
    
    
        const response = await sendData(movieObj, '/newEntry');
        console.log(response); //tell if successful or not
    }

    textEntry.value ='';
    movieInputSearch.value = '';

}

//send data to database
async function sendData(toWatchObj,route){
    
    const fetchObj = {
        method: 'POST',
        headers:{
            "Content-type": "application/json"
        },
        body: JSON.stringify(toWatchObj),
    }

    const rawResp = await fetch(route,fetchObj);
    const response = await rawResp.json();
    return response;
}

//add movies to the toWatch list
function addToList(selectedMovies){
    if (document.querySelector('.watchItem p').textContent == '[Your Movie Here] Comments:'){
        myWatchList.innerHTML = '';
    }

    for (let i=0; i<selectedMovies.length;i++){
        const myWatchItem = document.createElement('li');
        myWatchItem.classList.add('watchItem');
    
        const watchItemName = document.createElement('p');
        watchItemName.textContent = '[' + selectedMovies[i].Title + '] (' + selectedMovies[i].Year + ') Thoughts: ' + textEntry.value;
    
        const checkButtons = document.createElement("SPAN");
        checkButtons.textContent = "\u2713"
        checkButtons.classList.add('checkButton')
        checkButtons.addEventListener('click',addWatched)

        myWatchItem.append(watchItemName);
        myWatchItem.append(checkButtons);
        myWatchList.append(myWatchItem);

    }
}

function findCheckMovie(){
    let selectedMovies = [];
    const allMovies = document.querySelectorAll('.theMovie');
    const allMovieArray = Array.from(allMovies);
    for (let i=0; i<allMovieArray.length; i++){
        if (allMovieArray[i].childNodes[1].childNodes[1].checked){
            selectedMovies.push(currentSearchedMovies[i]);
        }
    }
    return selectedMovies;
}




