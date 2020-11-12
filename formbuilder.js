
document.body.classList.add("loading");

let imgElement = document.getElementById('imageOriginal');
let inputElement = document.getElementById('imageInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

let source;
let process;
let output;

let entities = [];
let threshold = 200;

let TextResult;
let ImageScale;



function onOpenCvReady() {
  document.body.classList.remove("loading");
}

imgElement.onload = async function() {
    
    source = cv.imread(imgElement);
    output = source.clone(); 
    process = source.clone();
    
    ImageScale = [this.naturalWidth / this.width, this.naturalHeight / this.height];
    
    RunOpenCV();
    await RunTesseract(Tesseract);
    DrawEntities(output);
    
    BuildForms();    
}

// OpenCV
async function RunOpenCV(){
    
    BuildGrayScaleProcessImage(200, 255);
    AddContours();
    AddCircles();
    
}

function BuildGrayScaleProcessImage(low, high){
    
    cv.cvtColor(process, process, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(process, process, low, high, cv.THRESH_BINARY);
}

function AddContours(){
    
    let contours = FindContours(process);
    for (let i = 0; i < contours.size(); i++) {
        
        const contour = contours.get(i);
        if (cv.contourArea(contour, false) > threshold) {
            let rect = cv.boundingRect(contour);
            
            entities.push( 
            {
                type : 'contour',
                boundingBoxMinX : rect.x,
                boundingBoxMinY : rect.y,
                boundingBoxMaxX : rect.x + rect.width,
                boundingBoxMaxY : rect.y + rect.height,
                id : createUUID()
            });
        }
    }
}

function FindContours(dst){
    
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(
        dst, contours,
        hierarchy, cv.RETR_TREE,
        cv.CHAIN_APPROX_SIMPLE
    );
        
    return contours;
}

function FindApproximatePolies(contours){
    
    let approxPolys = new cv.Mat();
    let poly = new cv.MatVector();
    for (let i = 0; i < contours.size(); i++) 
    {
        let cnt = contours.get(i);
        console.log(cnt)
        cv.approxPolyDP(cnt, approxPolys, 0.01 * cv.arcLength(cnt, true), true);
        poly.push_back(approxPolys);
    }
    
    return poly;
}

function AddCircles(){
    let otherMat = source.clone();
    let circleMat = new cv.Mat();
    
    cv.cvtColor(otherMat,otherMat, cv.COLOR_RGBA2GRAY);
    cv.HoughCircles(otherMat, circleMat, cv.HOUGH_GRADIENT, 1, 50, 100, 30, 1, 20);

    for(let i = 0; i < circleMat.cols; i++){
        
        let x = circleMat.data32F[i * 3];
        let y = circleMat.data32F[i * 3 + 1];
        let radius = circleMat.data32F[i * 3 + 2];
        
        entities.push(
        {
            type : 'circle',
            radius,
            x,
            y,
            id : createUUID()
        });
    }
    
}

// Tesseract
async function RunTesseract(Tesseract) {
  
    const exampleImage = imgElement.src;

    const worker = Tesseract.createWorker({
    logger: m => console.log(m)
    });
    Tesseract.setLogging(true);
    await work();    

    async function work() {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        let result = await worker.detect(exampleImage); 
        result = await worker.recognize(exampleImage);

        let words = result.data.words;
        
        for (let i = 0; i < words.length; i++) {
            
            word = words[i];
            console.log(word);
            entities.push( 
            {
                type : 'word',
                boundingBoxMinX : word.bbox.x0 / ImageScale[0],
                boundingBoxMinY : word.bbox.y0 / ImageScale[1],
                boundingBoxMaxX : word.bbox.x1 / ImageScale[0],
                boundingBoxMaxY : word.bbox.y1 / ImageScale[1],
                text : word.text, 
                id : createUUID()
            });
        }
        
        await worker.terminate();
    }
}

function DrawEntities(target){
    
    let rectangleColor = new cv.Scalar(0, 0, 255);
    let wordColor = new cv.Scalar(255, 0, 0);
    let circleColor = new cv.Scalar(0,255,0);
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        
        if(entity.type ===  'circle'){
            
            let center = new cv.Point(entity.x, entity.y);
            cv.circle(target, center, entity.radius, [0, 255,0,255], 3);    
        }
        else{
            
            let color = entity.type === 'word' ? wordColor : rectangleColor;
            let p1 = new cv.Point(entity.boundingBoxMinX, entity.boundingBoxMinY);
            let p2 = new cv.Point(entity.boundingBoxMaxX, entity.boundingBoxMaxY);
            cv.rectangle(target, p1, p2, color, 1, cv.LINE_AA, 0);
        }
    }
    
    cv.imshow('imageCanvas', target);
}

// Form Builder
function BuildForms(){
    
	//oluşturduğumuz entityleri divParsedForm'a koyup görelim.
    divHtmlOutput.style.display = "block";
    divParsedForm.style.display = "block";
    
    let formWidth = source.cols + "px";
    let formHeight = source.rows + "px";
    
    divParsedForm.style.left = 0 + "px";
    
    divParsedForm.style.width = formWidth;
    divParsedForm.style.height = formHeight;
    divParsedForm.style.border = "2px black solid";

    entities.forEach(entity => {
        GenerateFormElement(entity, divParsedForm);
    });
    
    var textArea = document.createElement("TEXTAREA");
    textArea.value = divParsedForm.innerHTML
    textArea.style.width = formWidth;
    textArea.style.height = formHeight;
    divHtmlOutput.style.width = formWidth;
    divHtmlOutput.style.height = formHeight;

    divHtmlOutput.appendChild(textArea);

}

function GenerateFormElement(entity, parent){
    
    console.log(`this entity is a ${entity.type}`);
    
    var forms = { 
        'word': GenerateLabel,
        'contour': GenerateTextbox,
        'button' : GenerateButton,
        'circle' : GenerateRadioButton
    }
    if(forms[entity.type])
       forms[entity.type](entity, parent);
}

function GenerateTextbox(entity, parent) {
  console.log("Generating textbox...");
  var textboxElement = document.createElement("input");
  textboxElement.setAttribute("type", "text");
  textboxElement.setAttribute("id", entity.id);

  textboxElement.style.position = "absolute";
  textboxElement.style.left = entity.boundingBoxMinX + "px";
  textboxElement.style.top = entity.boundingBoxMinY + "px";
  textboxElement.style.border = "1px solid black";

  var width = entity.boundingBoxMaxX - entity.boundingBoxMinX;
  var height = entity.boundingBoxMaxY - entity.boundingBoxMinY;

  textboxElement.style.width = width + "px";
  textboxElement.style.height = height + "px";

  parent.appendChild(textboxElement);
  console.log("Textbox generated!");
}

function GenerateButton(entity, parent) {
  console.log("Generating button...");
  var buttonElement = document.createElement("button");
  buttonElement.setAttribute("type", "button");
  buttonElement.setAttribute("id", entity.id);

  buttonElement.style.position = "absolute";
  buttonElement.style.left = entity.boundingBoxMinX + "px";
  buttonElement.style.top = entity.boundingBoxMinY + "px";

  var width = entity.boundingBoxMaxX - entity.boundingBoxMinX;
  var height = entity.boundingBoxMaxY - entity.boundingBoxMinY;

  buttonElement.style.width = width + "px";
  buttonElement.style.height = height + "px";
  buttonElement.style.border = "1px solid black";

    //   var buttonText = document.createTextNode(val.text);
  var buttonText = document.createTextNode("button");
  buttonElement.appendChild(buttonText);
  parent.appendChild(buttonElement);
  console.log("Button generated!");
}

function GenerateLabel(entity, parent) {

    if(entity.text.length <= 1)
        return; 
    
    console.log("Generating label...");
    var labelElement = document.createElement("label");
    labelElement.setAttribute("type", "label");
    labelElement.setAttribute("id", entity.id);

    labelElement.style.position = "absolute";
    labelElement.style.left = entity.boundingBoxMinX + "px";
    labelElement.style.top = entity.boundingBoxMinY + "px";

    var width = entity.boundingBoxMaxX - entity.boundingBoxMinX;
    var height = entity.boundingBoxMaxY - entity.boundingBoxMinY;

    labelElement.style.width = width + "px";
    labelElement.style.height = height + "px";

    var labelText = document.createTextNode(entity.text);
    labelElement.appendChild(labelText);
    parent.appendChild(labelElement);
    console.log("Label generated!");
}

function GenerateRadioButton(entity, parent){
    
    console.log("Generating RadioControl...");
    var radioElement = document.createElement("INPUT");
    radioElement.setAttribute("type", "radio");
    radioElement.setAttribute("id", entity.id);

    radioElement.style.position = "absolute";
    radioElement.style.left = entity.x - entity.radius+ "px";
    radioElement.style.top = entity.y - entity.radius + "px";

    radioElement.style.width = entity.radius * 2  + "px";
    radioElement.style.height = entity.radius * 2 + "px";

    parent.appendChild(radioElement);
    console.log("radio generated!");
}

function createUUID() {
   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
   });
}