export const fragmentShader = `
  varying vec3 Normal;
  varying vec3 Position;
  uniform vec3 Ka;
  uniform vec3 Kd;
  uniform vec3 Ks;
  uniform vec4 LightPosition;
  uniform vec3 LightIntensity;
  uniform float Shininess;

  vec3 phong() {
    vec3 n = normalize(Normal);
    vec3 s = normalize(vec3(LightPosition) - Position);
    vec3 v = normalize(vec3(-Position));
    vec3 r = reflect(-s, n);

    vec3 ambient = Ka;
    vec3 diffuse = Kd * max(dot(s, n), 0.0);
    vec3 specular = Ks * pow(max(dot(r, v), 0.0), Shininess);

    return LightIntensity * (ambient + diffuse + specular);
  }

  
  void main() {
    float ramp = (Position.x + 13.0) / 25.0;

    vec3 left = vec3(0.0, 1.0, 0.6392);
    vec3 right = vec3(0.0, 0.6392, 1.0);
    gl_FragColor = vec4(mix(left, right, clamp(ramp, 0.0, 1.0) ), 1.0);

    // gl_FragColor = vec4(ramp, ramp, ramp, 1.0);
    

}`;

export const vertexShader = `
  varying vec3 Normal;
  varying vec3 Position;
  
  void main() {
    Normal = normalize(normalMatrix * normal);
    Position = vec3(modelViewMatrix * vec4(position, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;