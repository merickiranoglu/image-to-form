
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

imgElement.onload = function() {
    
    ImageScale = [this.naturalWidth / this.width, this.naturalHeight / this.height];
    RunOpenCV();
    RunTesseract(Tesseract);
    
    // Formlar build edilmeden önce, CV Entityleri ve tessaracttan gelen entityleri beraber kullanmak gerekecek.
    BuildForms();
    
    //cv.imshow('imageCanvas', output);
}


// OpenCV
async function RunOpenCV(){
    
    source = cv.imread(imgElement);
    output =  source.clone(); 
    
    BuildGrayScaleProcessImage(200, 255);
    MakeEntities(threshold); 
    
    //cv.imshow('imageCanvas', output);
}

function BuildGrayScaleProcessImage(low, high){
    
    process = source.clone();
    cv.cvtColor(process, process, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(process, process, low, high, cv.THRESH_BINARY);
}

function FindContours(dst){
    
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(dst, contours,
        hierarchy, cv.RETR_TREE,
        cv.CHAIN_APPROX_SIMPLE);
        
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

function FindCircles()
{
    let otherMat = source.clone();
    let circleMat = new cv.Mat();
    
    cv.cvtColor(otherMat,otherMat, cv.COLOR_RGBA2GRAY);
    cv.HoughCircles(otherMat, circleMat, cv.HOUGH_GRADIENT, 1, 1, 100, 30, 1, 50);

    for(let i = 0; i < circleMat.cols; i++){

        let x = circleMat.data32F[i * 3];
        let y = circleMat.data32F[i * 3 + 1];
        let radius = circleMat.data32F[i * 3 + 2];
        
        //if(radius < 20)
        let center = new cv.Point(x,y);
        cv.circle(output, center, radius, [0, 255,0,255], 3);    
    }
    
}

function MakeEntities(threshold){
    
    let contours = FindContours(process);
    let poly = FindApproximatePolies(contours);
    for (let i = 0; i < contours.size(); ++i) {
        var entity = MakeEntity(contours.get(i), threshold);
        if(entity != null){
            entities.push(entity);
        }
    }
    FindCircles();
}

function MakeEntity(contour, threshold){
    
    let rectangleColor = new cv.Scalar(0, 0, 0);
    
    if (cv.contourArea(contour, false) > threshold) {
        
		//bu contour'dan bir entity yaratacağım. bounding box kullanmak bence makul.
        let newEntity = {}
        let rect = cv.boundingRect(contour);
        let point1 = new cv.Point(rect.x, rect.y);
        let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
       
        cv.rectangle(output, point1, point2, rectangleColor, 1, cv.LINE_AA, 0);
        console.log(rect)

        newEntity.type = DetectEntityType(); //returns 'textbox', 'button' or 'label'
        newEntity.boundingBoxMinX = point1.x;
        newEntity.boundingBoxMinY = point1.y;
        newEntity.boundingBoxMaxX = point2.x;
        newEntity.boundingBoxMaxY = point2.y;
        newEntity.id = createUUID();
        
        return newEntity;
    }
}

function DetectEntityType()  
{
  //burda artık textbox mı, label mı, button mu ona karar vermek gerekiyor.
  return 'textbox';
}

// Form Builder
function BuildForms(){
    
	//oluşturduğumuz entityleri divParsedForm'a koyup görelim.
    divHtmlOutput.style.display = "block";
    divParsedForm.style.display = "block";
    
    let formWidth = source.cols + "px";
    let formHeight = source.rows + "px";
    
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
        'label': GenerateLabel,
        'textbox': GenerateTextbox,
        'button' : GenerateButton,
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
  buttonElement.style.bottom = entity.boundingBoxMinY + "px";

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
  console.log("Generating label...");
  var labelElement = document.createElement("label");
  labelElement.setAttribute("type", "label");
  labelElement.setAttribute("id", entity.id);

  labelElement.style.position = "absolute";
  labelElement.style.left = entity.boundingBoxMinX + "px";
  labelElement.style.bottom = entity.boundingBoxMinY + "px";

  var width = entity.boundingBoxMaxX - entity.boundingBoxMinX;
  var height = entity.boundingBoxMaxY - entity.boundingBoxMinY;

  labelElement.style.width = width + "px";
  labelElement.style.height = height + "px";

  var labelText = document.createTextNode(entity.text);
  labelElement.appendChild(labelText);
  parent.appendChild(labelElement);
  console.log("Label generated!");
}


// Tesseract
function RunTesseract(Tesseract) {
  
    const exampleImage = imgElement.src;

    const worker = Tesseract.createWorker({
    logger: m => console.log(m)
    });
    Tesseract.setLogging(true);
    work();    

    async function work() {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        let result = await worker.detect(exampleImage);
        console.log(result.data);

        result = await worker.recognize(exampleImage);

        TextResult = result.data;
        
        let rectangleColor = new cv.Scalar(255, 0, 0);
        
        console.log(TextResult);
        
        
        for (let i = 0; i < TextResult.words.length; i++) {

            word = TextResult.words[i];
            
            console.log(word);
            p1 = new cv.Point(word.bbox.x0 / ImageScale[0], word.bbox.y0 / ImageScale[1]);
            p2 = new cv.Point(word.bbox.x1 / ImageScale[0], word.bbox.y1 / ImageScale[1]);
            
            cv.rectangle(output, p1, p2, rectangleColor, 1, cv.LINE_AA, 0);
        }
        cv.imshow('imageCanvas', output);
        
        //console.log(result.data);
        await worker.terminate();
    }
}

function createUUID() {
   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
   });
}