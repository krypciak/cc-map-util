const vec2: any = {}
vec2.add = function(otherVec?: Vec2) {
    const res = <Vec2>{};
    res.x = (otherVec && otherVec.x || 0);
    res.y = (otherVec && otherVec.y || 0);
    return res;
}

vec2.create = function(otherVec?: Vec2) {
	const res = <Vec2>{};
	res.x = (otherVec && otherVec.x || 0);
	res.y = (otherVec && otherVec.y || 0);
	return res;
}

vec2.createC = function(x?: number, y?: number) {
	const res = <Vec2>{};
	res.x = (x || 0);
	res.y = (y || 0);
	return res;
}

vec2.assign = function(v1: Vec2, v2: Vec2) {
	v1.x = (v2.x || 0);
	v1.y = (v2.y || 0);
	return v1;
}

vec2.assignC = function(v: Vec2, x?: number, y?: number) {
	v.x = (x || 0);
	v.y = (y || 0);
	return v;
}

vec2.add = function(v1: Vec2, v2: Vec2, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	res.x = (v1.x || 0) + (v2.x || 0);
	res.y = (v1.y || 0) + (v2.y || 0);
	return res;
}

vec2.addC = function(v1: Vec2, x?: number, y?: number, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	y = y === undefined || y === null ? x : y;
	res.x = (v1.x || 0) + (x || 0);
	res.y = (v1.y || 0) + (y || 0);
	return res;
}

vec2.sub = function(v1: Vec2, v2: Vec2, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	res.x = (v1.x || 0) - (v2.x || 0);
	res.y = (v1.y || 0) - (v2.y || 0);
	return res;
}

vec2.subC = function(v1: Vec2, x: number, y: number, copy?: boolean) {
	const res: any = copy ? {} : v1;
	y = y === undefined || y === null ? x : y;
	res.x = (v1.x || 0) - (x || 0);
	res.y = (v1.y || 0) - (y || 0);
	return res;
}

vec2.mul = function(v1: Vec2, v2: Vec2, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	res.x = (v1.x || 0) * (v2.x || 0);
	res.y = (v1.y || 0) * (v2.y || 0);
	return res;
}

vec2.mulC = function(v1: Vec2, x?: number, y?: number, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	y = y === undefined || y === null ? x : y;
	res.x = (v1.x || 0) * (x || 0);
	res.y = (v1.y || 0) * (y || 0);
	return res;
}

vec2.mulF = function(v1: Vec2, f: number, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	res.x = (v1.x || 0) * (f || 0);
	res.y = (v1.y || 0) * (f || 0);
	return res;
}

vec2.div = function(v1: Vec2, v2: Vec2, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	res.x = (v1.x || 0) / (v2.x || 0);
	res.y = (v1.y || 0) / (v2.y || 0);
	return res;
}

vec2.divC = function(v1: Vec2, x?: number, y?: number, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	y = y === undefined || y === null ? x : y;
	res.x = (v1.x || 0) / (x || 0);
	res.y = (v1.y || 0) / (y || 0);
	return res;
}

vec2.dot = function(v1: Vec2, v2: Vec2) {
	return (v1.x || 0) * (v2.x || 0) + (v1.y || 0) * (v2.y || 0);
}

vec2.dotR = function(v1: Vec2, v2: Vec2) {
	return -(v1.y || 0) * (v2.x || 0) + (v1.x || 0) * (v2.y || 0);
}

vec2.vlength = function(v: Vec2, newLength?: number, copy?: boolean) {
	const oldLength = Math.sqrt((v.x || 0) * (v.x || 0) + (v.y || 0) * (v.y || 0));
	if (newLength) {
		return vec2.mulC(v, oldLength ? newLength / oldLength : 1, undefined, copy);
	} else {
		return oldLength;
	}
}

vec2.limit = function(v: Vec2, min: number, max: number, copy?: boolean) {
	const length = vec2.vlength(v);
	if (length > max) {
		return vec2.mulC(v, max / length, undefined, copy);
	} else if (length < min) {
		return vec2.mulC(v, min / length, undefined, copy);
	} else {
		return copy || false ? vec2.create(v) : v;
	}
}

vec2.normalize = function(v: Vec2, copy?: boolean) {
	return vec2.vlength(v, 1, copy);
}

vec2.clockangle = function(v: Vec2) {
	let result = Math.acos(-(v.y || 0) / vec2.vlength(v));
	if (v.x < 0) {
		result = 2 * Math.PI - result;
	}
	return result || 0;
}

vec2.angle = function(v1: Vec2, v2: Vec2) {
	const result = Math.acos(vec2.dot(v1, v2) / (vec2.vlength(v1) * vec2.vlength(v2)));
	return result || 0;
}

vec2.rotate = function(v: Vec2, angle: number, copy?: boolean) {
	const res: any = copy || false ? {} : v;
	const x = v.x || 0;
	res.x = Math.cos(angle) * x + Math.sin(angle) * (v.y || 0);
	res.y = Math.sin(-angle) * x + Math.cos(angle) * (v.y || 0);
	return res;
}

vec2.rotate90CW = function(v: Vec2, copy?: boolean) {
	const res: any = copy || false ? {} : v;
	const x = (v.x || 0);
	res.x = (v.y || 0);
	res.y = -x;
	return res;
}

vec2.rotate90CCW = function(v: Vec2, copy?: boolean) {
	const res: any = copy || false ? {} : v;
	const x = (v.x || 0);
	res.x = -(v.y || 0);
	res.y = x;
	return res;
}

vec2.flip = function(v: Vec2, copy?: boolean) {
	const res: any = copy || false ? {} : v;
	res.x = -v.x;
	res.y = -v.y;
	return res;
}

vec2.equal = function(v1: Vec2, v2: Vec2) {
	return v1.x === v2.x && v1.y === v2.y;
}

vec2.distance = function(v1: Vec2, v2: Vec2) {
	const x = ((v1.x - v2.x) || 0);
	const y = ((v1.y - v2.y) || 0);
	return Math.sqrt(x * x + y * y);
}

vec2.distance2 = function(v1: Vec2, v2: Vec2) {
	const x = ((v1.x - v2.x) || 0);
	const y = ((v1.y - v2.y) || 0);
	return x * x + y * y;
}

vec2.lerp = function(v1: Vec2, v2: Vec2, i: number, copy?: boolean) {
	const res: any = copy || false ? {} : v1;
	res.x = (v1.x || 0) * (1 - i) + (v2.x || 0) * i;
	res.y = (v1.y || 0) * (1 - i) + (v2.y || 0) * i;
	return res;
}

global.Vec2 = vec2

