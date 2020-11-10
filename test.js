
document.body.classList.add("loading");

let imgElement = document.getElementById('imageOriginal');
let inputElement = document.getElementById('imageInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

let source;
let destination;
let entities = [];
let threshold = 500;

function onOpenCvReady() {
  document.body.classList.remove("loading");
}

imgElement.onload = function() {
    
    RunOpenCV();
    BuildForms();
    //await RunTesseract(Tesseract);
}

async function RunOpenCV(){
    
    source = cv.imread(imgElement);
    BuildDestinationImage(200, 255);
    MakeEntities(threshold); 
    
    cv.imshow('imageCanvas', destination);
}

function BuildDestinationImage(low, high){
    
    destination =  cv.Mat.zeros(source.cols, source.rows, cv.CV_8UC3);
    cv.cvtColor(source, destination, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(destination, destination, low, high, cv.THRESH_BINARY);
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

function MakeEntities(threshold){
    
    let contours = FindContours(destination);
    let poly = FindApproximatePolies(contours);
    for (let i = 0; i < contours.size(); ++i) {
        var entity = MakeEntity(contours.get(i), threshold);
        if(entity != null){
            entities.push(entity);
        }
    }
}

function MakeEntity(contour, threshold){
    
    let rectangleColor = new cv.Scalar(150, 0, 0);
    
    if (cv.contourArea(contour, false) > threshold) {
        
		//bu contour'dan bir entity yaratacağım. bounding box kullanmak bence makul.
        let newEntity = {}
        let rect = cv.boundingRect(contour);
        let point1 = new cv.Point(rect.x, rect.y);
        let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
       
        cv.rectangle(destination, point1, point2, rectangleColor, 2, cv.LINE_AA, 0);
        console.log('rect')
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

function DetectEntityType()  {
  //burda artık textbox mı, label mı, button mu ona karar vermek gerekiyor.
  return 'textbox'
}


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
        switch (entity.type) {
        case "label":
            console.log("this entity is a label!");
            GenerateLabel(entity.id, entity);
            break;
        case "textbox":
            console.log("this entity is a textbox!");
            GenerateTextbox(entity.id, entity);
            break;
        case "button":
            console.log("this entity is a button!");
            GenerateButton(entity.id, entity);
            break;
        }
    });
    
    var textArea = document.createElement("TEXTAREA");
    textArea.value = divParsedForm.innerHTML
    textArea.style.width = formWidth;
    textArea.style.height = formHeight;
    divHtmlOutput.style.width = formWidth;
    divHtmlOutput.style.height = formHeight;

    divHtmlOutput.appendChild(textArea);

}

function GenerateTextbox(id, entity) {
  console.log("Generating textbox...");
  var textboxElement = document.createElement("input");
  textboxElement.setAttribute("type", "text");
  textboxElement.setAttribute("id", id);

  textboxElement.style.position = "absolute";
  textboxElement.style.left = entity.boundingBoxMinX + "px";
  textboxElement.style.top = entity.boundingBoxMinY + "px";
  textboxElement.style.border = "1px solid black";

  var width = entity.boundingBoxMaxX - entity.boundingBoxMinX;
  var height = entity.boundingBoxMaxY - entity.boundingBoxMinY;

  textboxElement.style.width = width + "px";
  textboxElement.style.height = height + "px";

  divParsedForm.appendChild(textboxElement);
  console.log("Textbox generated!");
}

function GenerateButton(id, entity) {
  console.log("Generating button...");
  var buttonElement = document.createElement("button");
  buttonElement.setAttribute("type", "button");
  buttonElement.setAttribute("id", id);

  buttonElement.style.position = "absolute";
  buttonElement.style.left = entity.boundingBoxMinX + "px";
  buttonElement.style.bottom = entity.boundingBoxMinY + "px";

  var width = entity.boundingBoxMaxX - entity.boundingBoxMinX;
  var height = entity.boundingBoxMaxY - entity.boundingBoxMinY;

  buttonElement.style.width = width + "px";
  buttonElement.style.height = height + "px";
  buttonElement.style.border = "1px solid black";

  var buttonText = document.createTextNode(val.text);
  buttonElement.appendChild(buttonText);
  divParsedForm.appendChild(buttonElement);
  console.log("Button generated!");
}

function GenerateLabel(id, entity) {
  console.log("Generating label...");
  var buttonElement = document.createElement("label");
  buttonElement.setAttribute("type", "label");
  buttonElement.setAttribute("id", id);

  buttonElement.style.position = "absolute";
  buttonElement.style.left = entity.boundingBoxMinX + "px";
  buttonElement.style.bottom = entity.boundingBoxMinY + "px";

  var width = entity.boundingBoxMaxX - entity.boundingBoxMinX;
  var height = entity.boundingBoxMaxY - entity.boundingBoxMinY;

  buttonElement.style.width = width + "px";
  buttonElement.style.height = height + "px";

  var buttonText = document.createTextNode(entity.text);
  buttonElement.appendChild(buttonText);
  divParsedForm.appendChild(buttonElement);
  console.log("Label generated!");
}

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
        console.log(result.data);

        result = await worker.recognize(exampleImage);

        console.log(result.data);
        await worker.terminate();
        divHtmlOutput.style.display = "block";
        divParsedForm.style.display = "block";
    }
}


function createUUID() {
   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
   });
}