const btnHidden = () => {
    const photo = document.getElementById("photo");
    if (photo.files.length > 0) {
        document.getElementById("btnPhoto").hidden = true;
        const btnSubmit = document.getElementById("btnSubmit");
        btnSubmit.hidden = false;
    }
}
document.getElementById("photo").addEventListener("change",btnHidden);


const showImg = () =>{

    const photo = document.getElementById("photo");
    const file = photo.files[0];
    
    if (file) {
        const imageElement = document.getElementById("displayedImage");
        imageElement.style.display = "block";
        
        // Assuming 'imageUrl' is the URL of the uploaded image
        imageElement.src = URL.createObjectURL(file);;
    }
}
document.getElementById("photo").addEventListener("change", showImg);
