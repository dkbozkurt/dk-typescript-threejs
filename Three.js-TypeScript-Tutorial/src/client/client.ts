import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 2.5, 2.5)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const gridHelper = new THREE.GridHelper(100, 100)
scene.add(gridHelper)

const material = new THREE.MeshNormalMaterial({ wireframe: true })

const sphere = new THREE.Mesh(new THREE.SphereGeometry(), material)
sphere.position.y = 1
scene.add(sphere)

sphere.add(new THREE.AxesHelper(2))

camera.lookAt(sphere.position)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const keyMap: { [id: string]: boolean } = {}
const onDocumentKey = (e: KeyboardEvent) => {
    keyMap[e.code] = e.type === 'keydown'
}
document.addEventListener('keydown', onDocumentKey, false)
document.addEventListener('keyup', onDocumentKey, false)

const stats = new Stats()
document.body.appendChild(stats.dom)

const v0 = new THREE.Vector3()
const q = new THREE.Quaternion()
const angularVelocity = new THREE.Vector3()

const clock = new THREE.Clock()
let delta = 0

function animate() {
    requestAnimationFrame(animate)

    delta = clock.getDelta()

    if (keyMap['KeyW']) {
        angularVelocity.x -= delta * 5
    }
    if (keyMap['KeyS']) {
        angularVelocity.x += delta * 5
    }
    if (keyMap['KeyA']) {
        angularVelocity.z += delta * 5
    }
    if (keyMap['KeyD']) {
        angularVelocity.z -= delta * 5
    }

    q.setFromAxisAngle(angularVelocity, delta).normalize()
    sphere.applyQuaternion(q)

    angularVelocity.lerp(v0, 0.01) // slow down the roll

    gridHelper.position.x += angularVelocity.z * delta
    gridHelper.position.z -= angularVelocity.x * delta

    gridHelper.position.x = gridHelper.position.x % 10
    gridHelper.position.z = gridHelper.position.z % 10

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()