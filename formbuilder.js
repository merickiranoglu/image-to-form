
document.body.classList.add("loading");
let imgElement = document.getElementById('imageOriginal');
// let dstElement = document.getElementById()
let inputElement = document.getElementById('imageInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);
let src;
let entities = [];
divHtmlOutput.style.display = "none";
divParsedForm.style.display = "none";

imgElement.onload = function () {
  RunTesseract(Tesseract);
  //src upload edilen image
  src = cv.imread(imgElement);
  console.log(src)
  //dst upload edilen imagedaki ngonları daha okunabilir hale getirdiğim image.
  let dst = new cv.Mat()
  let approxPolys = new cv.Mat();
  dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(dst, dst, 200, 255, cv.THRESH_BINARY);
	
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let poly = new cv.MatVector();

  cv.findContours(dst, contours,
    hierarchy, cv.RETR_TREE,
    cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); i++) {
    //tüm contourlardan approximate polyline oluşturmaya calisiyorum.
    
    let cnt = contours.get(i);
    console.log(cnt)
    cv.approxPolyDP(cnt, approxPolys, 0.01 * cv.arcLength(cnt, true), true);
    poly.push_back(approxPolys);
  }
  let entityID = 0;

  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt, false);
    // alanı 500 px² den küçükse muhtemelen işe yaramaz bir ngondur. geçiyorum.
    if (area > 500) {
		//bu contour'dan bir entity yaratacağım. bounding box kullanmak bence makul.
      let newEntity = {}
      let rect = cv.boundingRect(cnt);
      let point1 = new cv.Point(rect.x, rect.y);
      let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
      let rectangleColor = new cv.Scalar(150, 0, 0);
      cv.rectangle(dst, point1, point2, rectangleColor, 2, cv.LINE_AA, 0);
      console.log('rect')
      console.log(rect)

      //entity tipini belirleyeceğiz.
      newEntity.type = DetectEntityType(); //returns 'textbox', 'button' or 'label'
      //parse metodlarını şöyle bir obje modeline göre yazmıştım, ona çeviriyorum.
    
      newEntity.boundingBoxMinX = point1.x;
      newEntity.boundingBoxMinY = point1.y;
      newEntity.boundingBoxMaxX = point2.x;
      newEntity.boundingBoxMaxY = point2.y;
      newEntity.id = entityID;

      entities.push(newEntity);
      entityID++
    }
  }
   divHtmlOutput.style.display = "block";
   divParsedForm.style.display = "block";
	
	//oluşturduğumuz entityleri divParsedForm'a koyup görelim.
  divParsedForm.style.width = src.cols + "px";
  divParsedForm.style.height = src.rows + "px";
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
  textArea.style.width = src.cols + "px";
  textArea.style.height = src.rows + "px";
  divHtmlOutput.style.width = src.cols + "px";
  divHtmlOutput.style.height = src.rows + "px";

  divHtmlOutput.appendChild(textArea);

  cv.imshow('imageCanvas', dst);
};


function onOpenCvReady() {
  document.body.classList.remove("loading");
}

function DetectEntityType()  {
  //burda artık textbox mı, label mı, button mu ona karar vermek gerekiyor.
  return 'textbox'
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
   console.log(result.data);

   await worker.terminate();

 }
}


