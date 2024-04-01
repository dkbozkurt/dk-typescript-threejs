import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import Stats from 'three/examples/jsm/libs/stats.module'

const scene = new THREE.Scene()

new RGBELoader().load(
    './img/kloppenheim_06_puresky_1k.hdr',
    function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.background = texture
        scene.environment = texture
    },
    (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100
        progressBar.value = percentComplete === Infinity ? 100 : percentComplete
    }
)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(1.15, 1.15, 1.15)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.y = 1

const progressBar = document.getElementById(
    'progressBar'
) as HTMLProgressElement

const loader = new GLTFLoader()
loader.load(
    'models/xbot.glb',
    function (gltf) {
        progressBar.style.display = 'none'
        scene.add(gltf.scene)
    },
    (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100
        progressBar.value = percentComplete === Infinity ? 100 : percentComplete
    }
)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
window.addEventListener('resize', onWindowResize, false)

const stats = new Stats()
document.body.appendChild(stats.dom)

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()