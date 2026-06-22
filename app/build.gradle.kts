plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

android {
  namespace = "com.example"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.example"
    minSdk = 26
    targetSdk = 35
    versionCode = 1
    versionName = "1.0"
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlinOptions {
    jvmTarget = "17"
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.12.0")
  implementation("androidx.appcompat:appcompat:1.6.1")
}

// --- Hybrid Bridge Pipelines: Compile React Webpack static output first ---
tasks.register<Exec>("npmInstall") {
  workingDir = file("${project.rootDir}")
  if (System.getProperty("os.name").lowercase().contains("windows")) {
    commandLine("cmd", "/c", "npm install")
  } else {
    commandLine("npm", "install")
  }
}

tasks.register<Exec>("npmBuildReact") {
  dependsOn("npmInstall")
  workingDir = file("${project.rootDir}")
  if (System.getProperty("os.name").lowercase().contains("windows")) {
    commandLine("cmd", "/c", "npm run build")
  } else {
    commandLine("npm", "run", "build")
  }
}

tasks.register<Copy>("copyReactAssets") {
  dependsOn("npmBuildReact")
  
  doFirst {
    delete(file("${project.projectDir}/src/main/assets"))
  }

  from(file("${project.rootDir}/dist"))
  into(file("${project.projectDir}/src/main/assets"))
}

tasks.named("preBuild") {
  dependsOn("copyReactAssets")
}
