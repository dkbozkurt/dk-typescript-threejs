import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(1, 2, 5)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xaec6cf, wireframe: true })
)
floor.rotateX(-Math.PI / 2)
scene.add(floor)

const geometry = new THREE.BoxGeometry()
//the cube used for .lerp
const cube1 = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
)
cube1.position.y = 0.5
scene.add(cube1)

//the cube used for .lerpVectors
const cube2 = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
)
cube2.position.y = 0.5
scene.add(cube2)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const raycaster = new THREE.Raycaster()
let v1 = new THREE.Vector3(2, 0.5, 2)
let v2 = new THREE.Vector3(0, 0.5, 0)
const mouse = new THREE.Vector2()

function onDoubleClick(event: THREE.Event) {
    mouse.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObject(floor, false)
    if (intersects.length > 0) {
        v1 = intersects[0].point
        v1.y += 0.5 //raise it so it appears to sit on grid
        //console.log(v1)
    }
}
renderer.domElement.addEventListener('dblclick', onDoubleClick, false)

const stats = new Stats()
document.body.appendChild(stats.dom)
const data = {
    lerpAlpha: 0.1,
    lerpVectorsAlpha: 1.0,
}
const gui = new GUI()

const lerpFolder = gui.addFolder('.lerp')
lerpFolder.add(data, 'lerpAlpha', 0, 1.0, 0.01)
lerpFolder.open()

const lerpVectorsFolder = gui.addFolder('.lerpVectors')
lerpVectorsFolder.add(data, 'lerpVectorsAlpha', 0, 1.0, 0.01)
lerpVectorsFolder.open()

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    cube1.position.lerp(v1, data.lerpAlpha)
    cube2.position.lerpVectors(v1, v2, data.lerpVectorsAlpha)
    controls.target.copy(cube1.position)
    render()
    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()