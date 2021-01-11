/*
    HiFi Controller Debugging Script
    Created October 26, 2018 by Ryan K. Hunter

    Copyright 2020 Vircadia contributors.

    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
*/

// Hardware constants, used for determining controller-specific choices.
NONE = 0;       // No HMD
VIVE = 1;       // HTC Vive
TOUCH = 2;      // Oculus Touch
MMR = 3;        // Microsoft Windows Mixed Reality

// Vive actions
DEADZONE = 0;
NORTH = 1;
SOUTH = 2;
EAST = 4;
WEST = 8;

// Global utility functions:
getPointVector = function (hand) {
    var pose = Controller.getPoseValue(hand === RIGHT_HAND ? Controller.Standard.RightHand : Controller.Standard.LeftHand);
    if (pose.valid) {
        return Vec3.multiplyQbyV(pose.rotation, Vec3.UNIT_Y);
    }
    return Vec3.ZERO;
}

getPalmVector = function (hand) {
    var pose = Controller.getPoseValue(hand === RIGHT_HAND ? Controller.Standard.RightHand : Controller.Standard.LeftHand);
    if (pose.valid) {
        return Vec3.multiplyQbyV(pose.rotation, Vec3.UNIT_Z);
    }
    return Vec3.ZERO;
}

getCurrentHardware = function () {
    if (Controller.Hardware.Vive) {
        return VIVE;
    } else if (Controller.Hardware.OculusTouch) {
        return TOUCH;
    } else {
        return NONE;
    }
    // XXX Lookup and add case for Windows Mixed Reality...
}

lookPointAngle = function (hand) {
    if (!(hand === RIGHT_HAND ? MyAvatar.rightHandPose.valid : MyAvatar.leftHandPose.valid)) {
        return 200;
    }
    // Get the hand pose and its rotation...
    var handRotation = Quat.multiply(MyAvatar.orientation, (hand === LEFT_HAND) ? MyAvatar.leftHandPose.rotation : MyAvatar.rightHandPose.rotation);
    //var headPose = Controller.getPoseValue("Head");
    var headRot = Camera.orientation;

    var pointingVector = Vec3.multiplyQbyV(handRotation, Vec3.UNIT_Y);
    var lookVector = Vec3.multiplyQbyV(headRot, FORWARD_VEC);

    return toDegrees(Vec3.getAngle(pointingVector, lookVector));
}

// Project vector 'v' onto vector 'w'.
projectVontoW = function (v, w) {
    // Project vector v onto vector w
    var denominator = Vec3.length(w);
    // Denominator should be mag(w)^2
    denominator *= denominator;
    return Vec3.multiply((Vec3.dot(v, w) / denominator), w);
}

// Radians to degrees utility function.
toDegrees = function (angle) {
    return angle * (180 / Math.PI);
}

// Degrees to radians utility function.
toRadians = function (angle) {
    return angle * (Math.PI / 180);
}

function RKController() {
	var _this = this;
	var mappingName = "Controller-Test-Mapping";
	var mapping = undefined;
	
	var viveMappingName = "Vive-Test-Mapping";
	var viveMapping = null;
	
	var touchMappingName = "Touch-Test-Mapping";
	var touchMapping = null;
	
	var mmrMappingName = "MMR-Test-Mapping";
	var mmrMapping = null;
	
	var stickDeadzone = 0.3;
	var triggerDeadzone = 0.3;
	var triggerPull = 0.9;
	var sticksDisabled = false;
	var linearMotionDisabled = false;
	var leftStickDisabled = false;
	var rightStickDisabled = false;
	
	// ctor, main loop, dtor
	this.init = function () {
		Script.update.connect(_this.update);
		Script.scriptEnding.connect(_this.cleanup);
		
		// Create HMD specific mappings:
		this.updateMappings();
		
		// Kill the original mappings...
		Controller.disableMapping("Standard to Action");
		mapping = Controller.newMapping(mappingName);
		
		// Mappings to get the values from standard controller.
		print("Make bindings...");
		this.standardMaps(mapping);
		
		// Stick axes...
		mapping.from(Controller.Standard.LX).to(_this.getLX);
		mapping.from(Controller.Standard.RX).to(_this.getRX);
		mapping.from(Controller.Standard.LY).to(_this.getLY);
		mapping.from(Controller.Standard.RY).to(_this.getRY);
		
		// L3 and R3...
		mapping.from(Controller.Standard.LS).to(_this.getLSClick);
		mapping.from(Controller.Standard.RS).to(_this.getRSClick);
		
		// Touching left or right stick...
		mapping.from(Controller.Standard.LSTouch).to(_this.getLSTouch);
		mapping.from(Controller.Standard.RSTouch).to(_this.getRSTouch);
		
		// Triggers
		mapping.from(Controller.Standard.LT).to(_this.getLT);
		mapping.from(Controller.Standard.RT).to(_this.getRT);
		mapping.from(Controller.Standard.LTClick).to(_this.getLTClick);
		mapping.from(Controller.Standard.RTClick).to(_this.getRTClick);
		
		// Grips...
		mapping.from(Controller.Standard.LeftGrip).to(_this.getLGrip);
		mapping.from(Controller.Standard.RightGrip).to(_this.getRGrip);
		
		// Buttons (Oculus)
		mapping.from(Controller.Standard.A).to(_this.getAButton);
		mapping.from(Controller.Standard.B).to(_this.getBButton);
		mapping.from(Controller.Standard.X).to(_this.getXButton);
		mapping.from(Controller.Standard.Y).to(_this.getYButton);
		
		// Finger position stuff.
		mapping.from(Controller.Standard.LeftIndexPoint).peek().to(_this.getLeftIndexPoint);
		mapping.from(Controller.Standard.RightIndexPoint).peek().to(_this.getRightIndexPoint);
		mapping.from(Controller.Standard.LeftThumbUp).peek().to(_this.getLeftThumbUp);
		mapping.from(Controller.Standard.RightThumbUp).peek().to(_this.getRightThumbUp);
		
		// Linear motion.
		// Left stick
		mapping.from(function() { 
				if (!linearMotionDisabled && !sticksDisabled && !leftStickDisabled && Math.abs(axisLY) >= stickDeadzone) {
					return axisLY;
				}
				return 0;
			}).to(Controller.Actions.TranslateZ);
		
		// Right stick
		mapping.from(function() { 
				if (!linearMotionDisabled && !sticksDisabled && !rightStickDisabled && Math.abs(axisRY) >= stickDeadzone) {
					return axisRY;
				}
				return 0;
			}).to(Controller.Actions.TranslateZ);
		
		// Snapturn and turning
		// Left stick
		mapping.from(function() {
				if (!sticksDisabled && !leftStickDisabled && Math.abs(axisLX) >= stickDeadzone && Controller.Hardware.Application.AdvancedMovement) {
					return axisLX;
				}
				return 0;
			})
			//.when(Controller.Hardware.Application.AdvancedMovement)
			.to(Controller.Actions.TranslateX);
			
		mapping.from(function() {
				if (!sticksDisabled && !leftStickDisabled && Math.abs(axisLX) >= stickDeadzone && !Controller.Hardware.Application.AdvancedMovement && !Controller.Hardware.Application.Snapturn) {
					return axisLX;
				}
				return 0;
			})
			//.when(!Controller.Hardware.Application.AdvancedMovement && !Controller.Hardware.Application.Snapturn)
			.to(Controller.Actions.Yaw);
		// Right stick
		// Snapturn
		mapping.from(function() {
				if (!sticksDisabled && !rightStickDisabled && Math.abs(axisRX) >= stickDeadzone && Controller.Hardware.Application.SnapTurn) {
					return axisRX; 
				}
				return 0;
			})
			//.when(Controller.Hardware.Application.SnapTurn)
			.pulse(0.25)
			.scale(22.5)
			.to(Controller.Actions.StepYaw);
			
		mapping.from(function() {
				if (!sticksDisabled && !rightStickDisabled && Math.abs(axisRX) >= stickDeadzone && !Controller.Hardware.Application.AdvancedMovement && !Controller.Hardware.Application.Snapturn) {
					return axisRX;
				}
				return 0;
			})
			//.when(!Controller.Hardware.Application.AdvancedMovement && !Controller.Hardware.Application.Snapturn)
			.to(Controller.Actions.Yaw);
			
		// Enable our standard mapping...
		Controller.enableMapping(mappingName);
		
		// Register hardware changed function...
		Controller.hardwareChanged.connect(_this.hardwareChanged);
	}
	
	var timer = 0;
	MAX_TIMER = 1;			// seconds
	DEBUG = 0;				// Flip this if you want prints
	this.update = function (deltaTime) {
		// Quick prints and stuff...
		if (DEBUG) {
			if (timer < MAX_TIMER) {
				timer += deltaTime;
				return;
			}
			print("Left Stick: (" + axisLX + ", " + axisLY + ")");
			print("Right Stick: (" + axisRX + ", " + axisRY + ")");
			print("Triggers: (" + axisLT + ", " + axisRT + ")");
			timer = 0;
			return;
		}
	}
	
	this.cleanup = function () {
		mapping.disable();
		Controller.enableMapping("Standard to Action");
		
		// Re-enable the standard JSON mappings...
		if (touchMapping) {
			Controller.enableMapping("Oculus Touch to Standard");
		}
		if (viveMapping) {
			Controller.enableMapping("Vive to Standard");
		}
		_this.disableMappings();
		Controller.hardwareChanged.disconnect(_this.hardwareChanged);
		Script.update.disconnect(_this.update);
		Script.scriptEnding.disconnect(_this.cleanup);
	}
	
	// Utilities and bindings
	this.enableLinearMotion = function () {
		linearMotionDisabled = false;
	}
	
	this.disableLinearMotion = function () {
		linearMotionDisabled = true;
	}
	
	this.enableJoysticks = function () {
		sticksDisabled = false;
	}
	
	this.disableJoysticks = function () {
		sticksDisabled = true;
	}
	
	this.disableLeftJoystick = function () {
		leftStickDisabled = true;
	}
	
	this.disableRightJoystick = function () {
		rightStickDisabled = true;
	}
	
	this.enableLeftJoystick = function () {
		leftStickDisabled = false;
	}
	
	this.enableRightJoystick = function () {
		rightStickDisabled = false;
	}
	
	this.setStickDeadzone = function (value) {
		if (value <= 1.0 && value >= 0.0) {
			stickDeadzone = value;
		} else {
			print("Bad value to set stick deadzone (expects [0,1] range).");
		}
	}
	
	this.setTriggerDeadzone = function (value) {
		if (value <= 1.0 && value >= 0.0) {
			triggerDeadzone = value;
		} else {
			print("Bad value to set trigger deadzone (expects [0,1] range).");
		}
	}
	
	this.setTriggerPullThreshold = function (value) {
		if (value < triggerDeadzone) {
			print("Warning: Trigger deadzone set to greater value than pull threshold.");
		}
		
		if (value <= 1.0 && value >= 0.0) {
			triggerPull = value;
		} else {
			print("Bad value to set trigger pull threshold (expects [0,1] range).");
		}
	}
	
	// Member vars
	var axisRY = 0, axisLY = 0;
	var axisRX = 0, axisLX = 0;
	var axisRT = 0, axisLT = 0;
	var RSClick = 0, LSClick = 0;
	var RSTouch = 0, LSTouch = 0;
	var RGrip = 0, LGrip = 0;
	var AButton = 0, BButton = 0, XButton = 0, YButton = 0;
	var rightIndexPoint = 0, leftIndexPoint = 0;
	var leftThumbUp = 0, rightThumbUp = 0;
	
	// Left stick Y-axis (up to down), [-1, 1].
	this.getLY = function (value) {
		axisLY = (Math.abs(value) > stickDeadzone && !sticksDisabled && !leftStickDisabled) ? value : 0.0;
	}
	
	// Right stick Y-axis (up to down), [-1, 1].
	this.getRY = function (value) {
		axisRY = (Math.abs(value) > stickDeadzone && !sticksDisabled && !rightStickDisabled) ? value : 0.0;
	}
	
	// Left stick X-axis (left to right), [-1, 1]
	this.getLX = function (value) {
		axisLX = (Math.abs(value) > stickDeadzone && !sticksDisabled && !leftStickDisabled) ? value : 0.0;
	}
	
	// Right stick X-axis (left to right), [-1, 1].
	this.getRX = function (value) {
		axisRX = (Math.abs(value) > stickDeadzone && !sticksDisabled && !rightStickDisabled) ? value : 0.0;
	}
	
	// Right trigger squeeze value [0, 1].
	this.getRT = function (value) {
		axisRT = (value > triggerDeadzone) ? value : 0.0;
	}
	
	// Left trigger squeeze value [0, 1].
	this.getLT = function (value) {
		axisLT = (value > triggerDeadzone) ? value : 0.0;
	}
	
	// Right trigger full squeeze (binary value).
	this.getRTClick = function (value) {
		RTClick = (value > triggerPull) ? 1.0 : 0.0;
	}
	
	// Left trigger full squeeze (binary value).
	this.getLTClick = function (value) {
		LTClick = (value > triggerPull) ? 1.0 : 0.0;
	}			
	
	// Right stick click, R3 (binary value).
	this.getRSClick = function (value) {
		RSClick = value;
	}
	
	// Left stick click, L3 (binary value).
	this.getLSClick = function (value) {
		LSClick = value;
	}
	
	// Right stick touch sensor.
	this.getRSTouch = function (value) {
		RSTouch = value;
	}
	
	// Left stick touch sensor.
	this.getLSTouch = function (value) {
		LSTouch = value;
	}
	
	// Right grip
	this.getRGrip = function (value) {
		RGrip = value;
	}
	
	// Left grip
	this.getLGrip = function (value) {
		LGrip = value;
	}
	
	// A button (Oculus, right controller)
	this.getAButton = function (value) {
		AButton = value;
	}
	
	// B button (Oculus, right controller)
	this.getBButton = function (value) {
		BButton = value;
	}
	
	// X button (Oculus, left controller)
	this.getXButton = function (value) {
		XButton = value;
	}
	
	// Y button (Oculus, left controller)
	this.getYButton = function (value) {
		YButton = value;
	}
	
	// Left index finger pointing (Oculus)
	this.getLeftIndexPoint = function (value) {
		leftIndexPoint = value;
	}
	
	// Right index finger pointing (Oculus)
	this.getRightIndexPoint = function (value) {
		rightIndexPoint = value;
	}
	
	// Left thumb up (Oculus)
	this.getLeftThumbUp = function (value) {
		leftThumbUp = value;
	}
	
	// Right thumb up (Oculus)
	this.getRightThumbUp = function (value) {
		rightThumbUp = value;
	}
	
	this.buildViveMappings = function () {
		print("Killing original Vive mappings...");
		Controller.disableMapping("Vive to Standard");
		print("Creating Vive mappings...");
		viveMapping = Controller.newMapping(viveMappingName);
		this.standardViveMaps(viveMapping);
		Controller.enableMapping(viveMappingName);
	}
	
	this.buildTouchMappings = function () {
		print("Killing original Oculus Touch mappings...");
		Controller.disableMapping("Oculus Touch to Standard");
		print("Creating Oculus Touch mappings...");
		touchMapping = Controller.newMapping(touchMappingName);
		_this.standardOculusMaps(touchMapping);
		touchMapping.from(Controller.Standard.LeftIndexPoint).peek().to(_this.getLeftIndexPoint);
		touchMapping.from(Controller.Standard.RightIndexPoint).peek().to(_this.getRightIndexPoint);
		touchMapping.from(Controller.Standard.LeftThumbUp).peek().to(_this.getLeftThumbUp);
		touchMapping.from(Controller.Standard.RightThumbUp).peek().to(_this.getRightThumbUp);
		Controller.enableMapping(touchMappingName);
	}
	
	this.buildMMRMappings = function () {
		print("Creating MMR mappings...");
		// Not supported yet.
	}
	
	var lastHardware = NONE;
	
	this.hardwareChanged = function () {
		_this.updateMappings();
	}
	
	this.disableMappings = function () {
		if (viveMapping) {
			viveMapping.disable();
		}
		if (touchMapping) {
			touchMapping.disable();
		}
		if (mmrMapping) {
			mmrMapping.disable();
		}
	}
	
	this.updateMappings = function () {
		 var hardware = getCurrentHardware();

		if (hardware !== lastHardware) {
			_this.disableMappings();
		}

		switch (hardware) {
			case NONE:
				// No HMD present.
				break;
			case VIVE:
				// HTC Vive:
				if (!viveMapping) {
					_this.buildViveMappings();
					// Add mappings here...
				}
				//print("Enabling mapping...");
				Controller.enableMapping(viveMappingName);
				break;
			case TOUCH:
				// Oculus Touch:
				if (!touchMapping) {
					_this.buildTouchMappings();
				}
				Controller.enableMapping(touchMappingName);
				break;
			case MMR:
				// Microsoft Windows Mixed Reality:
				if (!mmrMapping) {
					_this.buildMMRMappings();
				}
				Controller.enableMapping(mmrMapName);
				break;
		}

		lastHardware = hardware;
	}
		
	this.standardMaps = function(m) {
		m.from(Controller.Standard.LeftHand).to(Controller.Actions.LeftHand);
		
		m.from(Controller.Standard.LeftHandThumb1).to(Controller.Actions.LeftHandThumb1);
		m.from(Controller.Standard.LeftHandThumb2).to(Controller.Actions.LeftHandThumb2);
		m.from(Controller.Standard.LeftHandThumb3).to(Controller.Actions.LeftHandThumb3);
		m.from(Controller.Standard.LeftHandThumb4).to(Controller.Actions.LeftHandThumb4);
		
		m.from(Controller.Standard.LeftHandIndex1).to(Controller.Actions.LeftHandIndex1);
		m.from(Controller.Standard.LeftHandIndex2).to(Controller.Actions.LeftHandIndex2);
		m.from(Controller.Standard.LeftHandIndex3).to(Controller.Actions.LeftHandIndex3);
		m.from(Controller.Standard.LeftHandIndex4).to(Controller.Actions.LeftHandIndex4);
		
		m.from(Controller.Standard.LeftHandMiddle1).to(Controller.Actions.LeftHandMiddle1);
		m.from(Controller.Standard.LeftHandMiddle2).to(Controller.Actions.LeftHandMiddle2);
		m.from(Controller.Standard.LeftHandMiddle3).to(Controller.Actions.LeftHandMiddle3);
		m.from(Controller.Standard.LeftHandMiddle4).to(Controller.Actions.LeftHandMiddle4);
		
		m.from(Controller.Standard.LeftHandRing1).to(Controller.Actions.LeftHandRing1);
		m.from(Controller.Standard.LeftHandRing2).to(Controller.Actions.LeftHandRing2);
		m.from(Controller.Standard.LeftHandRing3).to(Controller.Actions.LeftHandRing3);
		m.from(Controller.Standard.LeftHandRing4).to(Controller.Actions.LeftHandRing4);
		
		m.from(Controller.Standard.LeftHandPinky1).to(Controller.Actions.LeftHandPinky1);
		m.from(Controller.Standard.LeftHandPinky2).to(Controller.Actions.LeftHandPinky2);
		m.from(Controller.Standard.LeftHandPinky3).to(Controller.Actions.LeftHandPinky3);
		m.from(Controller.Standard.LeftHandPinky4).to(Controller.Actions.LeftHandPinky4);
		
		m.from(Controller.Standard.RightHand).to(Controller.Actions.RightHand);
		
		m.from(Controller.Standard.RightHandThumb1).to(Controller.Actions.RightHandThumb1);
		m.from(Controller.Standard.RightHandThumb2).to(Controller.Actions.RightHandThumb2);
		m.from(Controller.Standard.RightHandThumb3).to(Controller.Actions.RightHandThumb3);
		m.from(Controller.Standard.RightHandThumb4).to(Controller.Actions.RightHandThumb4);
		
		m.from(Controller.Standard.RightHandIndex1).to(Controller.Actions.RightHandIndex1);
		m.from(Controller.Standard.RightHandIndex2).to(Controller.Actions.RightHandIndex2);
		m.from(Controller.Standard.RightHandIndex3).to(Controller.Actions.RightHandIndex3);
		m.from(Controller.Standard.RightHandIndex4).to(Controller.Actions.RightHandIndex4);
		
		m.from(Controller.Standard.RightHandMiddle1).to(Controller.Actions.RightHandMiddle1);
		m.from(Controller.Standard.RightHandMiddle2).to(Controller.Actions.RightHandMiddle2);
		m.from(Controller.Standard.RightHandMiddle3).to(Controller.Actions.RightHandMiddle3);
		m.from(Controller.Standard.RightHandMiddle4).to(Controller.Actions.RightHandMiddle4);
		
		m.from(Controller.Standard.RightHandRing1).to(Controller.Actions.RightHandRing1);
		m.from(Controller.Standard.RightHandRing2).to(Controller.Actions.RightHandRing2);
		m.from(Controller.Standard.RightHandRing3).to(Controller.Actions.RightHandRing3);
		m.from(Controller.Standard.RightHandRing4).to(Controller.Actions.RightHandRing4);
		
		m.from(Controller.Standard.RightHandPinky1).to(Controller.Actions.RightHandPinky1);
		m.from(Controller.Standard.RightHandPinky2).to(Controller.Actions.RightHandPinky2);
		m.from(Controller.Standard.RightHandPinky3).to(Controller.Actions.RightHandPinky3);
		m.from(Controller.Standard.RightHandPinky4).to(Controller.Actions.RightHandPinky4);
		
		m.from(Controller.Standard.LeftFoot).to(Controller.Actions.LeftFoot);
		m.from(Controller.Standard.RightFoot).to(Controller.Actions.RightFoot);
		
		m.from(Controller.Standard.Hips).to(Controller.Actions.Hips);
		m.from(Controller.Standard.Spine2).to(Controller.Actions.Spine2);
		
		m.from(Controller.Standard.Head).to(Controller.Actions.Head);
		m.from(Controller.Standard.LeftArm).to(Controller.Actions.LeftArm);
		m.from(Controller.Standard.RightArm).to(Controller.Actions.RightArm);
		
		m.from(Controller.Standard.TrackedObject00).to(Controller.Actions.TrackedObject00);
		m.from(Controller.Standard.TrackedObject01).to(Controller.Actions.TrackedObject01);
		m.from(Controller.Standard.TrackedObject02).to(Controller.Actions.TrackedObject02);
		m.from(Controller.Standard.TrackedObject03).to(Controller.Actions.TrackedObject03);
		m.from(Controller.Standard.TrackedObject04).to(Controller.Actions.TrackedObject04);
		m.from(Controller.Standard.TrackedObject05).to(Controller.Actions.TrackedObject05);
		m.from(Controller.Standard.TrackedObject06).to(Controller.Actions.TrackedObject06);
		m.from(Controller.Standard.TrackedObject07).to(Controller.Actions.TrackedObject07);
		m.from(Controller.Standard.TrackedObject08).to(Controller.Actions.TrackedObject08);
		m.from(Controller.Standard.TrackedObject09).to(Controller.Actions.TrackedObject09);
		m.from(Controller.Standard.TrackedObject10).to(Controller.Actions.TrackedObject10);
		m.from(Controller.Standard.TrackedObject11).to(Controller.Actions.TrackedObject11);
		m.from(Controller.Standard.TrackedObject12).to(Controller.Actions.TrackedObject12);
		m.from(Controller.Standard.TrackedObject13).to(Controller.Actions.TrackedObject13);
		m.from(Controller.Standard.TrackedObject14).to(Controller.Actions.TrackedObject14);
		m.from(Controller.Standard.TrackedObject15).to(Controller.Actions.TrackedObject15);
	}
	
	this.standardOculusMaps = function (m) {
		// Finish adding Oculus bindings here.
		m.from(Controller.Hardware.OculusTouch.A).peek().to(Controller.Standard.RightPrimaryThumb);
		m.from(Controller.Hardware.OculusTouch.X).peek().to(Controller.Standard.LeftPrimaryThumb);
		m.from(Controller.Hardware.OculusTouch.B).peek().to(Controller.Standard.RightSecondaryThumb);
		m.from(Controller.Hardware.OculusTouch.Y).peek().to(Controller.Standard.LeftSecondaryThumb);
		
		m.from(Controller.Hardware.OculusTouch.A).to(Controller.Standard.A);
		m.from(Controller.Hardware.OculusTouch.B).to(Controller.Standard.B);
		m.from(Controller.Hardware.OculusTouch.X).to(Controller.Standard.X);
		m.from(Controller.Hardware.OculusTouch.Y).to(Controller.Standard.Y);
		
		m.from(Controller.Hardware.OculusTouch.LY).invert().to(Controller.Standard.LY);
		m.from(Controller.Hardware.OculusTouch.LX).to(Controller.Standard.LX);
		m.from(Controller.Hardware.OculusTouch.LT).to(Controller.Standard.LT);
		m.from(Controller.Hardware.OculusTouch.LT).peek().hysteresis(0.85, 0.9).to(Controller.Standard.LTClick);
		m.from(Controller.Hardware.OculusTouch.LS).to(Controller.Standard.LS);
		m.from(Controller.Hardware.OculusTouch.LeftGrip).to(Controller.Standard.LeftGrip);

		m.from(Controller.Hardware.OculusTouch.RY).invert().to(Controller.Standard.RY);
		m.from(Controller.Hardware.OculusTouch.RX).to(Controller.Standard.RX);
		m.from(Controller.Hardware.OculusTouch.RT).peek().hysteresis(0.85, 0.9).to(Controller.Standard.RTClick);
		m.from(Controller.Hardware.OculusTouch.RT).to(Controller.Standard.RT);
		m.from(Controller.Hardware.OculusTouch.RS).to(Controller.Standard.RS);
		m.from(Controller.Hardware.OculusTouch.RightGrip).to(Controller.Standard.RightGrip);
		
		m.from(Controller.Hardware.OculusTouch.RightHand).when([Controller.Hardware.Application.InHMD]).to(Controller.Standard.RightHand);
		m.from(Controller.Hardware.OculusTouch.LeftHand).when([Controller.Hardware.Application.InHMD]).to(Controller.Standard.LeftHand);
		m.from(Controller.Hardware.OculusTouch.LeftPrimaryThumbTouch).to(Controller.Standard.LeftPrimaryThumbTouch);
		m.from(Controller.Hardware.OculusTouch.LeftSecondaryThumbTouch).to(Controller.Standard.LeftSecondaryThumbTouch);
		m.from(Controller.Hardware.OculusTouch.RightPrimaryThumbTouch).to(Controller.Standard.RightPrimaryThumbTouch);
		m.from(Controller.Hardware.OculusTouch.RightSecondaryThumbTouch).to(Controller.Standard.RightSecondaryThumbTouch);
		m.from(Controller.Hardware.OculusTouch.LeftPrimaryIndexTouch).to(Controller.Standard.LeftPrimaryIndexTouch);
		m.from(Controller.Hardware.OculusTouch.RightPrimaryIndexTouch).to(Controller.Standard.RightPrimaryIndexTouch);
		m.from(Controller.Hardware.OculusTouch.LSTouch).to(Controller.Standard.LSTouch);
		m.from(Controller.Hardware.OculusTouch.RSTouch).to(Controller.Standard.RSTouch);
		m.from(Controller.Hardware.OculusTouch.LeftThumbUp).to(Controller.Standard.LeftThumbUp);
		m.from(Controller.Hardware.OculusTouch.RightThumbUp).to(Controller.Standard.RightThumbUp);
		m.from(Controller.Hardware.OculusTouch.LeftIndexPoint).to(Controller.Standard.LeftIndexPoint);
		m.from(Controller.Hardware.OculusTouch.RightIndexPoint).to(Controller.Standard.RightIndexPoint);
		
		m.from(Controller.Hardware.OculusTouch.Head).when([Controller.Hardware.Application.InHMD]).to(Controller.Standard.Head);
	}
	
	this.standardViveMaps = function (m) {
		// Index finger stuff.
		m.from(Controller.Hardware.Vive.LY).peek().hysteresis(0.7, 0.75).to(Controller.Standard.LeftIndexPoint);
		m.from(Controller.Hardware.Vive.RY).peek().hysteresis(0.7, 0.75).to(Controller.Standard.RightIndexPoint);
		
		// Left Controller
		m.from(Controller.Hardware.Vive.LY).invert().to(Controller.Standard.LY);
		m.from(Controller.Hardware.Vive.LX).to(Controller.Standard.LX);
		m.from(Controller.Hardware.Vive.LT).to(Controller.Standard.LT);
		m.from(Controller.Hardware.Vive.LTClick).to(Controller.Standard.LTClick);
		m.from(Controller.Hardware.Vive.LeftGrip).to(Controller.Standard.LeftGrip);
		m.from(Controller.Hardware.Vive.LS).to(Controller.Standard.LS);
		m.from(Controller.Hardware.Vive.LSTouch).peek().logicalNot().to(Controller.Standard.LeftThumbUp);
		n.from(Controller.Hardware.Vive.LSTouch).to(Controller.Standard.LSTouch);
		
		// Right Controller
		m.from(Controller.Hardware.Vive.RY).invert().to(Controller.Standard.RY);
		m.from(Controller.Hardware.Vive.RX).to(Controller.Standard.RX);
		m.from(Controller.Hardware.Vive.RT).to(Controller.Standard.RT);
		m.from(Controller.Hardware.Vive.RTClick).to(Controller.Standard.RTClick);
		m.from(Controller.Hardware.Vive.RightGrip).to(Controller.Standard.RightGrip);
		m.from(Controller.Hardware.Vive.RS).to(Controller.Standard.RS);
		m.from(Controller.Hardware.Vive.RSTouch).peek().logicalNot().to(Controller.Standard.RightThumbUp);
		m.from(Controller.Hardware.Vive.RSTouch).to(Controller.Standard.RSTouch);
		
		// Other
		m.from(Controller.Hardware.Vive.LSCenter).to(Controller.Standard.LeftPrimaryThumb);
		m.from(Controller.Hardware.Vive.LeftApplicationMenu).to(Controller.Standard.LeftSecondaryThumb);
		m.from(Controller.Hardware.Vive.RSCenter).to(Controller.Standard.RightPrimaryThumb);
		m.from(Controller.Hardware.Vive.RightApplicationMenu).to(Standard.RightSecondaryThumb);
		
		m.from(Controller.Hardware.Vive.LeftHand).to(Controller.Standard.LeftHand);
		m.from(Controller.Hardware.Vive.RightHand).to(Controller.Standard.RightHand);
		
		m.from(Controller.Hardware.Vive.LeftFoot).exponentialSmoothing(0.15).translation(0.3).to(Controller.Standard.LeftFoot);
		
		m.from(Controller.Hardware.Vive.RightFoot).exponentialSmoothing(0.15).translation(0.3).to(Controller.Standard.RightFoot);
		
		m.from(Controller.Hardware.Vive.Hips).exponentialSmoothing(0.15).translation(0.3).to(Controller.Standard.Hips);
		
		m.from(Controller.Hardware.Vive.Spine2).exponentialSmoothing(0.15).translation(0.3).to(Controller.Standard.Spine2);
		
		m.from(Controller.Hardware.Vive.Head).to(Controller.Standard.Head);
		m.from(Controller.Hardware.Vive.RightArm).to(Controller.Standard.RightArm);
		m.from(Controller.Hardware.Vive.LeftArm).to(Controller.Standard.LeftArm);
		m.from(Controller.Hardware.Vive.TrackedObject00).to(Controller.Standard.TrackedObject00);
		m.from(Controller.Hardware.Vive.TrackedObject01).to(Controller.Standard.TrackedObject01);
		m.from(Controller.Hardware.Vive.TrackedObject02).to(Controller.Standard.TrackedObject02);
		m.from(Controller.Hardware.Vive.TrackedObject03).to(Controller.Standard.TrackedObject03);
		m.from(Controller.Hardware.Vive.TrackedObject04).to(Controller.Standard.TrackedObject04);
		m.from(Controller.Hardware.Vive.TrackedObject05).to(Controller.Standard.TrackedObject05);
		m.from(Controller.Hardware.Vive.TrackedObject06).to(Controller.Standard.TrackedObject06);
		m.from(Controller.Hardware.Vive.TrackedObject07).to(Controller.Standard.TrackedObject07);
		m.from(Controller.Hardware.Vive.TrackedObject08).to(Controller.Standard.TrackedObject08);
		m.from(Controller.Hardware.Vive.TrackedObject09).to(Controller.Standard.TrackedObject09);
		m.from(Controller.Hardware.Vive.TrackedObject10).to(Controller.Standard.TrackedObject10);
		m.from(Controller.Hardware.Vive.TrackedObject11).to(Controller.Standard.TrackedObject11);
		m.from(Controller.Hardware.Vive.TrackedObject12).to(Controller.Standard.TrackedObject12);
		m.from(Controller.Hardware.Vive.TrackedObject13).to(Controller.Standard.TrackedObject13);
		m.from(Controller.Hardware.Vive.TrackedObject14).to(Controller.Standard.TrackedObject14);
		m.from(Controller.Hardware.Vive.TrackedObject15).to(Controller.Standard.TrackedObject15);
	}
}

var CHandler = new RKController();
CHandler.init();
