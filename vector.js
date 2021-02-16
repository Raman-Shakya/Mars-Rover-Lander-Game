function add(v1, v2){
    return [v1[0]+v2[0], v1[1]+v2[1]]
}

function subtract(v1, v2){
    return [v1[0]-v2[0], v1[1]-v2[1]]
}

function angle(v1){
    return Math.atan(v1[1]/v1[0])
}

function toDegrees(ang){
    return (180/Math.PI)*ang
}

function toRadians(ang){
    return (Math.PI*180)*ang
}