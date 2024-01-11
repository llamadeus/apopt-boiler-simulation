import type { Vec3 } from '../types';


export function computeAngles(point1: Vec3, point2: Vec3): Vec3 {
  const direction: Vec3 = {
    x: point2.x - point1.x,
    y: point2.y - point1.y,
    z: point2.z - point1.z,
  };
  const length = Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2);
  const xAngle = Math.acos(direction.x / length);
  const yAngle = Math.acos(direction.y / length);
  const zAngle = Math.acos(direction.z / length);

  // Calculate the individual rotation angles
  // const xAngle = Math.atan2(direction.z, direction.x);
  // const yAngle = 0; Math.atan2(direction.z, direction.y);
  // // const yAngle = Math.atan2(-direction.x, Math.sqrt(direction.y ** 2 + direction.z ** 2));
  // const zAngle = Math.atan2(direction.y, direction.x);

  return {
    x: xAngle,
    y: yAngle,
    z: zAngle,
  };

  // // Calculate the individual x, y, and z angles
  // const xAngle = Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);
  // const yAngle = Math.atan2(vector2.z, vector2.y) - Math.atan2(vector1.z, vector1.y);
  // const zAngle = Math.atan2(vector2.z, vector2.x) - Math.atan2(vector1.z, vector1.x);
  //
  // return {
  //   x: xAngle,
  //   y: yAngle,
  //   z: zAngle,
  // };
}
