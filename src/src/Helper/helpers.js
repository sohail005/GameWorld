import * as THREE from 'three';

export function createFinishLineTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  const size = 16;
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 2; y++) {
      context.fillStyle = (x + y) % 2 === 0 ? '#fff' : '#000';
      context.fillRect(x * size, y * size, size, size);
    }
  }
  return new THREE.CanvasTexture(canvas);
}

export function createHome(x, z, scene) {
  const homeGroup = new THREE.Group();
  const houseGeometry = new THREE.BoxGeometry(6, 4, 6);
  const houseMaterial = new THREE.MeshStandardMaterial({ color: 0xb5651d });
  const house = new THREE.Mesh(houseGeometry, houseMaterial);
  house.position.y = 2;
  house.castShadow = true;
  house.receiveShadow = true;
  homeGroup.add(house);

  const roofGeometry = new THREE.ConeGeometry(5, 3, 4);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  homeGroup.add(roof);

  homeGroup.position.set(x, 0, z);
  scene.add(homeGroup);
}

export function createParkedCar(x, z, scene, color = 0x0000ff) {
  const carGroup = new THREE.Group();
  const bodyGeometry = new THREE.BoxGeometry(2.5, 1, 5);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  carGroup.add(body);

  const cabinGeometry = new THREE.BoxGeometry(2, 0.8, 2.5);
  const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 0.9, -0.5);
  cabin.castShadow = true;
  carGroup.add(cabin);

  carGroup.position.set(x, 0.5, z);
  carGroup.rotation.y = Math.random() * Math.PI * 2;
  scene.add(carGroup);
}