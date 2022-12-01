const uploadBtn = document.getElementById("upload-btn");
const uploadInput = document.getElementById("upload-input");

/**
 * @description
 * This function initializes the application by creating event listeners
 * @returns {Promise<void>}
 */
function main() {
  uploadBtn.addEventListener("click", handleUploadClick);
  uploadInput.addEventListener("change", (e)=>handleSelectFile(e));

}

/**
 *
 * @description
 * This function is the event handler for upload button click
 * @param _event
 * @returns {Promise<void>}
 */
async function handleUploadClick(_event) {
  uploadInput.click();
}

/**
 * @description
 * This function handles the selection of a new JSON data file.
 * @param event
 * @returns {Promise<void>}
 */
async function handleSelectFile(event){
  console.log(event)
  const fileReader = new FileReader();
  fileReader.readAsText(event.target.files[0]);
  fileReader.onload = (e)=>{
    processData(JSON.parse(e.target.result))
  }
}

/**
 * @description
 * This function processes the JSON data
 * @param data
 * @returns {Promise<void>}
 */
async function processData(data){
  console.log("You have watched", data.length, "videos")
}
main()
  .then((done) => {
    console.debug("App initialization completed with success");
  })
  .catch((error) => {
    console.error("Fatal error :", error);
  });
