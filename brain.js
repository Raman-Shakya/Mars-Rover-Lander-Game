let game_height = window.innerHeight
let game_width = window.innerWidth
let gravity = 0.3
let targetPoint = 500
let ground_height = 50

document.querySelector(".game .target").style.marginLeft = targetPoint+"px"

function delay(n){
    return new Promise(done=>setTimeout(done,n))
}

function background(){
    document.querySelector(".game").style.height = game_height+"px"
    document.querySelector(".game .ground").style.margin = (game_height - ground_height) +"px 0"
}

class Rover{
    /* 
    rover state definition
        0 => freefall
        1 => parachute
        2 => skycrane
        3 => touch
        4 => exit
    */
    constructor([a,b], xcor, ycor, path, state=0){
        this.vector=[a,b];
        this.xcor = xcor
        this.ycor = ycor
        this.path = path
        this.parachuteR = 0.1 //10% retardation rate
        this.paraX = 0
        this.paraY = 0
        this.paraHeight = 50
        this.paraWidth  = 80
        this.dtPara = 100
        this.skyCraneHeight = 18
        this.percyHeight = 7
        this.ParachutePos()
        this.state = state
        this.sepDist = 0
        // Angle is measured with vertical axis to ground in radians
        this.Angle = Math.PI*.75
        this.thrustVal = 0
        this.pause = true
    }
    render() {
        let Angle = toDegrees(this.Angle)
        document.querySelector("#vectorShow").innerHTML = `[ ${Math.round(this.vector[0]*100)/100}, ${Math.round(this.vector[1]*100)/100} ]`
        document.querySelector("#angle").innerHTML = (Math.round(toDegrees(this.Angle)*10)/10)
        document.querySelector(this.path).style.margin = `${this.ycor}px ${this.xcor}px`
        document.querySelector(".game #parachute").style.margin = `${this.paraY}px ${this.paraX}px`
        document.querySelector(this.path).style.transform = `rotate(${90-Angle}deg)`
        document.querySelector(".game #parachute").style.transform = `rotate(${90-Angle}deg)`
        document.querySelector(".score").innerHTML = Math.floor((game_width-(Math.abs(targetPoint-this.xcor)))*100)/100
        document.querySelector(".msg").innerHTML = 
            this.state == 0 ? "Atmospheric Entry":
            this.state == 1 ? "Parachute Deploy":
            this.state == 2 ? "Powered Descent":
            this.state == 3 ? "Near Touchdown":""
    }
    next_pos() {
        if (!this.pause) return
        // gravity
        this.vector = add(this.vector,[0, gravity])
        // state machine
        if (this.state==1) { // for parachute
            document.querySelector(".game #parachute").style.display = "block";
            let q = this.vector[0]*this.paraWidth*Math.sin(this.Angle-Math.PI/2),
                r = this.vector[1]*this.paraWidth*Math.cos(this.Angle-Math.PI/2)
            this.vector[0]-=q>0?q*0.001:0
            this.vector[1]-=r>0?r*0.001:0
        }
        else document.querySelector(".game #parachute").style.display = "none"
        if (this.state==2) { // skycrane hover
            this.Thrust(this.thrustVal)
        }
        if (this.state==3) {
            this.Thrust(this.thrustVal)
            document.querySelector(this.path+" #Perseverance").style.transform = `rotate(${toDegrees(this.Angle)-90}deg)`
            if (this.sepDist<=35)
                document.querySelector(".game .Percy #Perseverance").style.marginTop = `${this.sepDist++}px`
        }
        // game over detection
        if (this.ycor + this.sepDist + this.skyCraneHeight + this.percyHeight > game_height - ground_height){
            this.ycor = game_height - ground_height - (this.sepDist + this.skyCraneHeight + this.percyHeight)
            this.state = 4
            return (Math.abs(this.vector[1])<=0.5 && Math.abs(this.vector[0])<=0.5)?"LANDED SUCCESSFULLY :D":"PERSEVERANCE CRASHED :("
        }
        if (this.xcor<0 || this.xcor>game_width || this.ycor<0){
            return "Perseverance Went Off The Screen"
        }
        this.xcor += this.vector[0]
        this.ycor += this.vector[1]
        this.ParachutePos()
    }
    ParachutePos(){
        this.paraX = this.xcor+this.dtPara*Math.sin(this.Angle+Math.PI/2)-this.paraHeight/2
        this.paraY = this.ycor+this.dtPara*Math.cos(this.Angle+Math.PI/2)
    }
    Thrust(F){
        // assuming thrust comes from bottom of the craft
        if (this.state<2) return
        document.querySelector("#thrust1").style.height = `${F*20}px`
        document.querySelector("#thrust2").style.height = `${F*20}px`
        if (this.thrustVal>0){
            document.querySelector("#thrust1").style.display = "block"
            document.querySelector("#thrust2").style.display = "block"
        }
        else {
            document.querySelector("#thrust1").style.display = "none"
            document.querySelector("#thrust2").style.display = "none"
        }
        let Angle = this.Angle
        this.vector = subtract(this.vector, [-F*Math.cos(Angle), F*Math.sin(Angle)])
    }
    Right(){
        this.Angle = (this.Angle - Math.PI/36)%(Math.PI*2)
    }
    Left(){
        this.Angle = (this.Angle + Math.PI/36)%(Math.PI*2)
    }
    togglePlay() {
        this.play = !this.play
    }
}

document.onkeydown = function (x){
    if (x.key=="ArrowRight")
        Percy.Right()
    else if (x.key=="ArrowLeft")
        Percy.Left()
    else if (x.key=="ArrowUp")
        Percy.thrustVal = Percy.thrustVal>=gravity+.2?gravity+.2:Percy.thrustVal+0.1
        // Percy.thrustVal+=0.2
    else if (x.key=="ArrowDown")
        Percy.thrustVal=Percy.thrustVal<0?0:Percy.thrustVal-0.1
    else if (x.key==" ")
        Percy.state+=Percy.state<3?1:0
}

async function play() {
    window.clearInterval(gameInterval);
    
    Percy = new Rover([40, 1], 10, 10, ".game .Percy")
    Percy.render();
    await delay(1000)
    running = false

    document.getElementById('play-button').addEventListener('click', start);
    start()
    
    function start() {
        running = !running
        if (running) {
            gameInterval = window.setInterval(() => {
                let a = Percy.next_pos()
                Percy.render();
                if (a) {
                    document.querySelector(".msg").innerHTML = a
                    document.querySelector(".score").innerHTML = Math.floor((game_width-(Math.abs(targetPoint-Percy.xcor)))*100)/100
                    window.clearInterval(gameInterval);
                }
            }, 100);
        }
        else {
            window.clearInterval(gameInterval)
        }
    }
}

var gameInterval, running;
background()
play()