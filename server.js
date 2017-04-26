const express = require("express"); 
const morgan = require("morgan"); 
const bodyParser  = require("body-parser"); 
const watson = require("watson-developer-cloud"); 

var services = JSON.parse(process.env.VCAP_SERVICES || "{}");

console.log(services); 

const pi = new watson.PersonalityInsightsV3({
  "username": services["personality_insights"][0].credentials.username,
  "password": services["personality_insights"][0].credentials.password, 
  "version_date" : "2016-10-20"
});

const nlu = new watson.NaturalLanguageUnderstandingV1({
  "username": services["natural-language-understanding"][0].credentials.username,
  "password": services["natural-language-understanding"][0].credentials.password, 
  "version_date": "2017-02-27"
});

const app = express(); 

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(morgan("dev")); 

var feat = {
	concepts: {},
	entities: {},
	keywords: {},
	categories: {},
	emotion: {},
	sentiment: {},
	semantic_roles: {} 
}; 

//Este arreglo representa la "base de datos"
var bd = {}; 

function prepararDatosNLU(req, nombreProp){
	//El servicio NLU requiere de un objeto con tres atributos: language , text y features
	//Esta función recibe el objeto "req" y  regresa un objeto que puede ser utilizado para la llamada a NLU
	var nuevo = {} ; 
	nuevo.language = "es"; 
	nuevo.text = req.body[nombreProp]; 
	nuevo.features = feat; 
	return nuevo ; 
}

function prepararDatosPI(req, nombreProp){
	var nuevo = {} ; 
	nuevo.text = req.body[nombreProp]; 
	nuevo.raw_scores = true ; 
	nuevo.headers = {
		"accept-language": "es",
	}; 
	return nuevo ; 
}

app.post("/cvnlu" , function(req,res){

	if (!bd[req.body.nombre])
		bd[req.body.nombre] = {} ; 

	nlu.analyze( prepararDatosNLU(req,"expLab") ,  function (error, results) {
		if (error) { 
			console.log(error); 
		} 
		else{
			bd[req.body.nombre].expLabNLU = results ; 
		}
	});

	nlu.analyze( prepararDatosNLU(req,"histAcad") ,  function (error, results) {
		if (error) { 
			console.log(error); 
		} 
		else{
			bd[req.body.nombre].histAcadNLU = results ; 
		}
	});

	res.json({"msj":"entregado"}); 

});

app.post("/cvpi" , function(req,res){

	if (!bd[req.body.nombre])
		bd[req.body.nombre] = {} ; 

	pi.profile( prepararDatosPI(req,"expLab"), function(error, response){
		if(error){
			console.log(error); 
		}
		else{
			bd[req.body.nombre].expLabPI = response ; 
		}
	});

	pi.profile( prepararDatosPI(req,"histAcad"), function(error, response){
		if(error){
			console.log(error); 
		}
		else{
			bd[req.body.nombre].histAcadPI = response ; 
		}
	});

	res.json({"msj":"entregado"}); 
});

app.get("/imprimir" , function(req, res){
	console.log(bd); 
	res.json({"msj":"base de datos impresa"}); 
}); 

app.get("/", function(req, res){
	//Regresamos el archivo html estático con nombre  "index.html"
	res.sendFile(__dirname+"/index.html");
});

//Iniciamos el servidor, puerto:3333
var port = process.env.VCAP_APP_PORT || 3333;
app.listen(port);
