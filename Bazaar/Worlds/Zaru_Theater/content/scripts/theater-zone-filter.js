function filter(p, filterType) {
    var MAX_DENSITY = 1000;
    var MAX_EXTENT = 0.6;
    var MAX_VELOCITY = 10.0;


    /* we don't allow edits that change dimensions, or model urls, etc... but
     * we allow you to rez things, so we apply the filters below only if this
     * is not an add (note adds start with everything at default values which
     * is fine).  Also note you cannot add something and change most of
     * its properties, which limits you to really creating default spheres and the like,
     * or rezzing stuff from marketplace
     * */
    if (filterType !== Entities.ADD_FILTER_TYPE) {
        /* cap density at standard 1 kg/m^3) */
        if (p.density && p.density > MAX_DENSITY) {
            p.density = MAX_DENSITY;
        }

        /* cap bounding box */
        if (p.dimensions) {
            function capDimension(d) {
                if (d > MAX_EXTENT) {
                    return MAX_EXTENT;
                }
                return d;
            }

            p.dimensions.x = capDimension(p.dimensions.x);
            p.dimensions.y = capDimension(p.dimensions.y);
            p.dimensions.z = capDimension(p.dimensions.z);
        }

        /* Clamp magnitude of the velocity vector
         * for now, not changing acceleration
         *
        if (p.velocity) {
            function magnitude(v) {
                return Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
            }
            var magV = magnitude(p.velocity);
            if (magV > MAX_VELOCITY) {
                var ratio = MAX_VELOCITY/magV;
                // reduce it proportionally
                p.velocity.x = p.velocity.x * ratio;
                p.velocity.y = p.velocity.y * ratio;
                p.velocity.z = p.velocity.z * ratio;
            }
        }
        */
        /* Reject if modifications made to Model properties, OR */
        /* Reject if modifications made to source URL (for Web entities) OR */
        /* Reject if modifications made to dimensions */
        if (p.modelURL !== undefined || p.compoundShapeURL || p.shape || p.shapeType || p.url ||
                p.fps || p.currentFrame || p.running || p.loop || p.firstFrame || p.lastFrame || p.hold ||
                p.textures !== undefined || p.xTextureURL !== undefined || p.yTextureURL !== undefined ||
                p.zTextureURL !== undefined ||  p.sourceUrl !== undefined || p.dimensions) {
            print("rejecting edit: " + JSON.stringify(p));
            return false;
        }
    }

    return p;
}

