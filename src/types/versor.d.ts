declare module "versor" {
  type Vec2 = [number, number];
  type Vec3 = [number, number, number];
  type Quaternion = [number, number, number, number];

  function versor(rotation: Vec3): Quaternion;

  namespace versor {
    function cartesian(coordinates: Vec2): Vec3;
    function delta(v0: Vec3, v1: Vec3): Quaternion;
    function multiply(q0: Quaternion, q1: Quaternion): Quaternion;
    function rotation(q: Quaternion): Vec3;
  }

  export default versor;
}
