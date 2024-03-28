export const fragmentShader = `
  varying vec3 Normal;
  varying vec3 Position;
  varying vec3 worldPosition;
  uniform vec3 Ka;
  uniform vec3 Kd;
  uniform vec3 Ks;
  uniform vec4 LightPosition;
  uniform vec3 LightIntensity;
  uniform float Shininess;
  uniform vec3 myColor;
  uniform vec3 myPosition;
  uniform mat4 modelMatrix;

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

  // void main() {
  //   gl_FragColor = vec4(myPosition / 4.0, 1.0);
  // }
  
  void main() {
    float ramp = (Position.x + 13.0) / 25.0 + myPosition.x;
    
    vec4 localPosition = modelMatrix * vec4(Position, 1.0);
    float AlphaRamp = (localPosition.y + 10.0) / 100.0;
    float AlphaRamp2 = (localPosition.y - 305.0) / 100.0;
    float AlphaRamp3 = (localPosition.y - 10.0) / 100.0;
    float AlphaRamp4 = (localPosition.y + 2.0) / 80.0;


    vec3 left = vec3(0.0, 1.0, 0.6392);
    vec3 right = vec3(0.0, 0.6392, 1.0);
    // vec3 left = vec3(1.0, .0, 0.0);
    // vec3 right = vec3(0.0, 0.0, 1.0);
    vec3 gradient = vec3(mix(left, right, clamp(ramp, 0.0, 1.0)));
    AlphaRamp = clamp(AlphaRamp * 0.5 + 4.5, 0.0, 1.0) - clamp(AlphaRamp2 * 0.5 + 4.5, 0.0, 1.0);
    AlphaRamp2 = clamp(AlphaRamp * 0.5 + 4.5, 0.0, 1.0) - clamp(AlphaRamp4 * 0.5 + 4.5, 0.0, 1.0);

    vec3 blink = vec3(1.0, 0.0, 0.6392) * AlphaRamp * 1.5;
    vec3 blink2 = vec3(0.0, 1.0, 0.0) * AlphaRamp2 * 2.0;
    vec3 dark = vec3(1.0, 1.0, 1.0) / clamp(AlphaRamp3 * 0.5 + 4.5, 0.0, 1.0);
    gl_FragColor = vec4((gradient + blink + blink2 ) / dark, 1.0);

    // gl_FragColor = vec4(ramp, ramp, ramp, 1.0);
  }


// void main() {
//   vec4 localPosition = modelMatrix * vec4(Position, 1.0);
//   float AlphaRamp = (localPosition.y + 10.0) / 100.0;
  
//   float ramp = (Position.x + 13.0) / 25.0;

//   vec3 left = vec3(0.0, 1.0, 0.6392);
//   vec3 right = vec3(0.0, 0.6392, 1.0);
//   gl_FragColor = vec4(mix(left, right, clamp(ramp, 0.0, 1.0) ), AlphaRamp) + vec4(AlphaRamp, 0.0, 0.0, 0.0);

// }


`;

export const vertexShader = `
  varying vec3 Normal;
  varying vec3 Position;
  
  void main() {
    Normal = normalize(normalMatrix * normal);
    Position = vec3(modelViewMatrix * vec4(position, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;