/**
 *  Closure
 */
document.addEventListener("DOMContentLoaded", function(_e) {
    
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.status == 200 && this.readyState == 4) {
            parseAndDisplay(this.responseText);   
        }
    }
    xhttp.open("GET", "./textes/essai.txt");
    // xhttp.send();
    
    
    document.getElementById('fileinput').addEventListener('change', function(evt) {
        //Retrieve the first (and only!) File from the FileList object
        var f = evt.target.files[0]; 

        if (f) {
            var r = new FileReader();
            r.onload = function(e) { 
                parseAndDisplay(e.target.result);
            }
            r.readAsText(f);
        } else { 
            alert("Chargement du fichier impossible");
        }        
        document.getElementById("frmLoading").reset();
    });
         
    // traitement du texte
    function parseAndDisplay(content) {
        
        // parsing des chapitres et récupération des erreurs
        var data = parse(content);
        
        // vérifie atteignabilité 
        verification(data);
        
        // affichage des erreurs ou affichage des chapitres
        if (data.errors.length > 0) {
            afficherErreurs(data.errors);
        }
        else {        
            afficher(data.chapters);
            document.location.replace(document.location.href.substr(0, document.location.href.indexOf("#")) + "#0");
        }
    }
    
    
    // parsing des chapitres et identification des erreurs de syntaxe éventuelles
    function parse(content) {
        var data = { chapters: {}, errors: [] };   
     
        var t = content.split("[1]");
        
        // vérification que le chapitre 1 est bien présent
        if (t.length == 1) {
            data.errors.push("Le livre ne contient pas de chapitre [1].");
            return data;
        }
        
        var nb = 1;
        
        do {
            content = t[1];            
            t = content.split("[" + (nb+1) + "]");
            // t[0] contient le chapitre courant --> parsing du chapitre
            var chap = { id: nb, titre: null, textes: [], liens: [] };
            
            var parts = t[0].split("-->");
                        
            // parts[0] = titre + texte[0] + texte[1] + ...
            var firstLines = parts[0].split("\n\n");
            
            // identification du titre 
            chap.titre = firstLines[0].trim();
            if (chap.titre.length == 0) {
                data.errors.push("Le titre du chapitre " + nb + " est vide.");   
            }
            // extraction des lignes de texte 
            for (var i=1; i < firstLines.length; i++) {
                if (firstLines[i].trim() != "") {
                    chap.textes.push(firstLines[i].trim());
                }
            }
            if (chap.textes.length == 0) {
                data.errors.push("Le texte du chapitre " + nb + " est vide.");   
            }
            
            // parties suivantes = 1 part/lien 
            for (var i=1; i < parts.length; i++) {
                var li = parts[i].split(":");
                if (li.length != 2) {
                    data.errors.push("Le lien " + i + " du chapitre " + nb + " n'a pas le bon format.");       
                }
                else if (li[0].trim().length == 0) {
                    data.errors.push("Le chapitre cible du lien " + i + " du chapitre " + nb + " est vide.");   
                }
                else if (li[1].trim().length == 0) {
                    data.errors.push("Le texte du lien " + i + " du chapitre " + nb + " est vide.");   
                }
                else {
                    chap.liens.push({ suivant: li[0].trim(), texte: li[1].trim() });
                }
            }       
            
            // ajout du chapitre à la liste
            data.chapters[nb] = chap;
            nb++;
            
        } while(t.length > 1);
        
        return data;
    }
    
    
    // vérifie l'atteignabilité des chapitres, et des références faites
    function verification(data) {
        
        var visited = {};
        for (var c in data.chapters) {
            visited[c] = false;   
        }
        
        var todo = [1];
        
        while (todo.length > 0) {
            var current = todo.pop();
            if (data.chapters[current]) {
                visited[current] = true;
                for (var l in data.chapters[current].liens) {
                    var suivant = data.chapters[current].liens[l].suivant;
                    if (! data.chapters[suivant]) {
                        data.errors.push("Le chapitre " + suivant  + " (référencé en lien du chapitre " + current + ") n'existe pas.");   
                    }
                    else if ((!visited[suivant]) && todo.indexOf(suivant) < 0) {
                        todo.push(suivant);
                    }
                }
                console.log(todo);
            }
        }
        
        for (var c in visited) {
            if (! visited[c]) {
                data.errors.push("Le chapitre " + c + " ne peut pas être atteint.");    
            }
        }
    }
    

    // affichage des erreurs
    function afficherErreurs(tabErrors) {    
        document.body.innerHTML = "<p>Les erreurs suivantes ont été détectées :</p><ul><li>" + 
                                        tabErrors.join("</li><li>") + "</li></ul>";
    }
    
    // affichage des chapitres
    function afficher(chapitres) {    
        
        document.body.innerHTML = "<section id='0'><p><a href='#1'>Démarrer</a></p></section>";
        
        for (var c in chapitres) {
         
            var chap = chapitres[c];
            
            var section = document.createElement("section");
            section.id = chap.id;
        
            section.innerHTML = 
                "<h2>" + chap.titre + "</h2>" +
                "<p>" + chap.textes.map(function(el) { return el.replace("\n","<br>"); }).join("</p><p>") + "</p>" +
                "<ul>" + chap.liens.map(function(el) { return "<li><a href='#" + el.suivant + "'>" + el.texte + "</a></li>"; }).join("") + "</ul>";
            
            document.body.appendChild(section);
            
        }
    }
    
    
});      
