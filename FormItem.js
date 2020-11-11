
/** @abstract */
class Form 
{
    constructor(entity)
    {
        this.entity = entity;
        if(this.constructor === Form)
            throw new Error("Cant instantiate abstract class");    
    }
    
    GenerateForm() {throw new console.error("Cant call abstract method");}
}

/**
 * @class Textbox
 * @extends {Form}
 */
class Textbox extends Form{
    
    GenerateForm(parent)
    {
        console.log("Generating textbox...");
        var textboxElement = document.createElement("input");
        textboxElement.setAttribute("type", "text");
        textboxElement.setAttribute("id", this.entity.id);

        textboxElement.style.position = "absolute";
        textboxElement.style.left = this.entity.boundingBoxMinX + "px";
        textboxElement.style.top = this.entity.boundingBoxMinY + "px";
        textboxElement.style.border = "1px solid black";

        var width = this.entity.boundingBoxMaxX - this.entity.boundingBoxMinX;
        var height = this.entity.boundingBoxMaxY - this.entity.boundingBoxMinY;

        textboxElement.style.width = width + "px";
        textboxElement.style.height = height + "px";

        parent.appendChild(textboxElement);
        console.log("Textbox generated!");
    }
}

/**
 * @class Button
 * @extends {Form}
 */
class Button extends Form{
    GenerateForm(parent)
    {
        console.log("Generating button...");
        var buttonElement = document.createElement("button");
        buttonElement.setAttribute("type", "button");
        buttonElement.setAttribute("id", this.entity.id);

        buttonElement.style.position = "absolute";
        buttonElement.style.left = this.entity.boundingBoxMinX + "px";
        buttonElement.style.bottom = this.entity.boundingBoxMinY + "px";

        var width = this.entity.boundingBoxMaxX - this.entity.boundingBoxMinX;
        var height = this.entity.boundingBoxMaxY - this.entity.boundingBoxMinY;

        buttonElement.style.width = width + "px";
        buttonElement.style.height = height + "px";
        buttonElement.style.border = "1px solid black";

            //   var buttonText = document.createTextNode(val.text);
        var buttonText = document.createTextNode("button");
        buttonElement.appendChild(buttonText);
        parent.appendChild(buttonElement);
        console.log("Button generated!");
    }
}

/**
 * @class Label
 * @extends {Form}
 */
class Label extends Form{
    GenerateForm(parent)
    {
        console.log("Generating label...");
        var buttonElement = document.createElement("label");
        buttonElement.setAttribute("type", "label");
        buttonElement.setAttribute("id", this.entity.id);

        buttonElement.style.position = "absolute";
        buttonElement.style.left = this.entity.boundingBoxMinX + "px";
        buttonElement.style.bottom = this.entity.boundingBoxMinY + "px";

        var width = this.entity.boundingBoxMaxX - this.entity.boundingBoxMinX;
        var height = this.entity.boundingBoxMaxY - this.entity.boundingBoxMinY;

        buttonElement.style.width = width + "px";
        buttonElement.style.height = height + "px";

        var buttonText = document.createTextNode(this.entity.text);
        buttonElement.appendChild(buttonText);
        parent.appendChild(buttonElement);
        console.log("Label generated!");
    }
}