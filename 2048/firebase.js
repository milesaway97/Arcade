const ul = document.getElementById("score-group");
const doc_id = db.collection("scores").doc().id; // creates new doc id
let prevScore = 0; // updates score in firebase if player keeps on playing

//
//  set player datas
function setPlayer() {
    let newScore = Math.max(app.highScore, prevScore);
    let date = new Date().toLocaleDateString();
    db.collection("scores").doc(doc_id).set({
        name: app.name,
        score: newScore,
        date_created: date
    });
    prevScore = newScore;
}

//
// add to list
const addPlayerToLeaderboard = (doc) => {
    // create the li
    let li = document.createElement('li');
    li.className = "list-group-item";
    li.setAttribute("data-id", doc.id);

    // create the div
    let div = document.createElement('div');
    div.className = "d-flex w-100 justify-content-between";
    div.id = "player";

    // create the name header
    let name = document.createElement('h5');
    name.className = "mb-1";
    name.id = "player_name";

    // create the score header
    let score = document.createElement('h5');
    score.className = "mb-1";
    score.id = "player_score";

    // create the date text
    let date = document.createElement('small');
    date.className = "d-flex justify-content-end";
    date.id = "player_date";

    name.textContent = doc.data().name;
    score.textContent = doc.data().score;
    date.textContent = doc.data().date_created;

    div.appendChild(name);
    div.appendChild(score);
    li.appendChild(div);
    li.appendChild(date);
    ul.appendChild(li);
}

//
// get data from firestore
function getData() {
    db.collection("scores").orderBy("score", "desc").onSnapshot(snapshot => {
        let changes = snapshot.docChanges();
        changes.forEach(change => {
            switch (change.type) {
                case "added":
                    addPlayerToLeaderboard(change.doc);
                    break;
                default:
                    break;
            }
        });
    });
}
