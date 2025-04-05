window.onload = setup

function setup() {
    document.querySelector("#save").addEventListener("click", save)
    document.querySelector("#default").addEventListener("click", reset)

    let temp = localStorage.getItem("ScratchColorData")
    let data
    if (temp) {
        data = JSON.parse(temp)
    } else {
        data = {
            "s3lc": "#4c97ff",
            "s3dc": "#3875ca",
            "s2lc": "#0f8bc0",
            "s2dc": "#0c6185"
        }
    }

    let els = document.querySelectorAll("input")
    els[0].parentElement.style.color = data.s3lc
    els[0].value = data.s3lc
    els[1].parentElement.style.color = data.s3dc
    els[1].value = data.s3dc
    els[2].parentElement.style.color = data.s2lc
    els[2].value = data.s2lc
    els[3].parentElement.style.color = data.s2dc
    els[3].value = data.s2dc
}

function save() {
    let els = document.querySelectorAll("input")
    let data = {}
    data.s3lc = els[0].value
    data.s3dc = els[1].value
    data.s2lc = els[2].value
    data.s2dc = els[3].value
    localStorage.setItem("ScratchColorData", JSON.stringify(data))
    window.close()
}

function reset() {
    localStorage.removeItem("ScratchColorData")
    location.reload()
}