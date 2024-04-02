import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import TWEEN from '@tweenjs/tween.js'
// For missing typescript definition error see https://sbcode.net/threejs/tween/

const scene = new THREE.Scene()

const spotLight = new THREE.SpotLight(0xffffff, 500)
spotLight.position.set(5, 5, 5)
spotLight.angle = 0.3
spotLight.penumbra = 0.5
spotLight.castShadow = true
spotLight.shadow.mapSize.width = 512
spotLight.shadow.mapSize.height = 512
spotLight.shadow.bias = -0.001
spotLight.shadow.radius = 20
spotLight.shadow.blurSamples = 10
spotLight.shadow.camera.far = 15
scene.add(spotLight)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
)
camera.position.y = 2
camera.position.z = 4

// const helper = new THREE.CameraHelper(spotLight.shadow.camera)
// scene.add(helper)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhysicalMaterial({ color: 0xff8800 })
)
cube.position.set(-2, 0, 0)
cube.castShadow = true
cube.userData.scaled = false
scene.add(cube)

const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.66),
    new THREE.MeshPhysicalMaterial({ color: 0x008800 })
)
cylinder.castShadow = true
cylinder.userData.scaled = false
scene.add(cylinder)

const pyramid = new THREE.Mesh(
    new THREE.TetrahedronGeometry(),
    new THREE.MeshPhysicalMaterial({ color: 0x0088ff })
)
pyramid.position.set(2, 0, 0)
pyramid.castShadow = true
pyramid.userData.scaled = false
scene.add(pyramid)

const texture = new THREE.TextureLoader().load('img/grid.png')

const envTexture = new THREE.CubeTextureLoader().load([
    'img/px_25.jpg',
    'img/nx_25.jpg',
    'img/py_25.jpg',
    'img/ny_25.jpg',
    'img/pz_25.jpg',
    'img/nz_25.jpg',
])
envTexture.mapping = THREE.CubeReflectionMapping
scene.environment = envTexture

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshPhysicalMaterial()
) //{map:texture}))
floor.rotateX(-Math.PI / 2)
floor.position.y = -1.25
floor.receiveShadow = true
scene.add(floor)

const raycaster = new THREE.Raycaster()
let intersects: THREE.Intersection[]
const pickableObjects: THREE.Mesh[] = [cube, cylinder, pyramid]
let hoveredObject: null | THREE.Mesh = null
const wasHoveredObjects: THREE.Mesh[] = []

const originalMaterial = [
    cube.material.clone(),
    cylinder.material.clone(),
    pyramid.material.clone(),
]

const highlightedMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff2244,
    reflectivity: 1.0,
    map: texture,
})

const mouse = new THREE.Vector2()
function onDocumentMouseMove(event: MouseEvent) {
    mouse.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)
    intersects = raycaster.intersectObjects(pickableObjects, false)

    pickableObjects.forEach((o: THREE.Mesh, i) => {
        if (wasHoveredObjects.includes(o)) {
            wasHoveredObjects.splice(wasHoveredObjects.indexOf(o), 1)
            //console.log(wasHoveredObjects)
            new TWEEN.Tween((o.material as THREE.MeshPhysicalMaterial).color)
                .to(
                    {
                        r: originalMaterial[i].color.r,
                        g: originalMaterial[i].color.g,
                        b: originalMaterial[i].color.b,
                    },
                    100
                )
                .start()
            new TWEEN.Tween(o.material as THREE.MeshPhysicalMaterial)
                .to(
                    {
                        thickness: 0,
                        roughness: 1,
                        clearcoat: 0,
                        transmission: 0,
                        ior: 1.5,
                    },
                    100
                )
                .start()
        }
    })
    if (intersects.length) {
        const o = intersects[0].object as THREE.Mesh

        if (hoveredObject !== o) {
            if (hoveredObject !== null) {
                //currently something already hovered, so unhover it
                wasHoveredObjects.push(hoveredObject)
            }

            hoveredObject = o

            new TWEEN.Tween((o.material as THREE.MeshPhysicalMaterial).color)
                .to(
                    {
                        r: highlightedMaterial.color.r,
                        g: highlightedMaterial.color.g,
                        b: highlightedMaterial.color.b,
                    },
                    100
                )
                .start()
            new TWEEN.Tween(o.material as THREE.MeshPhysicalMaterial)
                .to(
                    {
                        thickness: 3.0,
                        roughness: 0.1,
                        clearcoat: 0.1,
                        transmission: 0.99,
                        ior: 1.1,
                    },
                    100
                )
                .start()
        }
    } else {
        // no intersects so nothing should be coloured as if hovered
        if (hoveredObject !== null) {
            wasHoveredObjects.push(hoveredObject)
            hoveredObject = null
        }
    }
}
document.addEventListener('mousemove', onDocumentMouseMove, false)

function onClick(event: MouseEvent) {
    raycaster.setFromCamera(mouse, camera)
    intersects = raycaster.intersectObjects(pickableObjects, false)

    if (intersects.length) {
        if (!intersects[0].object.userData.scaled) {
            intersects[0].object.userData.scaled = true
            new TWEEN.Tween((intersects[0].object as THREE.Mesh).scale)
                .to(
                    {
                        x: 1.5,
                        y: 1.5,
                        z: 1.5,
                    },
                    250
                )
                .start()
        } else {
            intersects[0].object.userData.scaled = false
            new TWEEN.Tween((intersects[0].object as THREE.Mesh).scale)
                .to(
                    {
                        x: 1.0,
                        y: 1.0,
                        z: 1.0,
                    },
                    250
                )
                .start()
        }
    }
}
renderer.domElement.addEventListener('pointerdown', onClick, false)

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

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
    cylinder.rotation.x += 0.01
    cylinder.rotation.y += 0.01
    pyramid.rotation.x += 0.01
    pyramid.rotation.y += 0.01

    controls.update()

    //helper.update()

    TWEEN.update()

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()