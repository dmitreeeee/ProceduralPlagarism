document.querySelector('#hc-enable').addEventListener('click', e => {
    document.body.classList.add('app__high-contrast')
    e.target.remove()
})

setTimeout( () => {
    document.querySelector('#hc-enable').classList.add('hc__active')
}, 500)
