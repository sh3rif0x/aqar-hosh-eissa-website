var RUNTIME_PUBLIC_PATH = "server/chunks/[turbopack]_runtime.js";
var RELATIVE_ROOT_PATH = "..";
var ASSET_PREFIX = "/";
// Apply forwarded globals from workerData if running in a worker thread
if (typeof require !== 'undefined') {
    try {
        var { workerData } = require('worker_threads');
        if (workerData?.__turbopack_globals__) {
            Object.assign(globalThis, workerData.__turbopack_globals__);
            // Remove internal data so it's not visible to user code
            delete workerData.__turbopack_globals__;
        }
    } catch (_) {
        // Not in a worker thread context, ignore
    }
}
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
/// <reference path="./async-module.ts" />
/**
 * Describes why a module was instantiated.
 * Shared between browser and Node.js runtimes.
 */ var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    /**
   * The module was instantiated because it was included in a chunk's hot module
   * update.
   * SourceData is an array of ModuleIds or undefined.
   */ SourceType[SourceType["Update"] = 2] = "Update";
    return SourceType;
}(SourceType || {});
/**
 * Flag indicating which module object type to create when a module is merged. Set to `true`
 * by each runtime that uses ModuleWithDirection (browser dev-base.ts, nodejs dev-base.ts,
 * nodejs build-base.ts). Browser production (build-base.ts) leaves it as `false` since it
 * uses plain Module objects.
 */ let createModuleWithDirectionFlag = false;
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache.get(id);
    if (module === undefined) {
        if (createModuleWithDirectionFlag) {
            // set in development modes for hmr support
            module = createModuleWithDirection(id);
        } else {
            module = createModuleObject(id);
        }
        moduleCache.set(id, module);
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
function createModuleWithDirection(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined,
        parents: [],
        children: []
    };
}
const BindingTag_Value = 0;
/**
 * Terminates a module's group of entries in an {@link EsmReexports} list.
 */ const REEXPORT_GROUP_END = 0;
/**
 * Adds the getters to the exports object.
 */ function esm(exports, bindings, dynamic) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < bindings.length){
        const propName = bindings[i++];
        const tagOrFunction = bindings[i++];
        if (typeof tagOrFunction === 'number') {
            if (tagOrFunction === BindingTag_Value) {
                defineProp(exports, propName, {
                    value: bindings[i++],
                    enumerable: true,
                    writable: false
                });
            } else {
                throw new Error(`unexpected tag: ${tagOrFunction}`);
            }
        } else {
            const getterFn = tagOrFunction;
            if (typeof bindings[i] === 'function') {
                const setterFn = bindings[i++];
                defineProp(exports, propName, {
                    get: getterFn,
                    set: setterFn,
                    enumerable: true
                });
            } else {
                defineProp(exports, propName, {
                    get: getterFn,
                    enumerable: true
                });
            }
        }
    }
    // The properties defined above are already non-configurable and
    // non-writable, so the namespace's existing exports are effectively
    // immutable. Sealing additionally makes the object non-extensible, matching
    // real ESM-namespace semantics. Modules with dynamic re-exports
    // (`export *` from a CommonJS module) must stay extensible so the dynamic
    // export proxy can surface keys discovered at runtime, so skip the seal for
    // them.
    if (!dynamic) Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(bindings, id, dynamic) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, bindings, dynamic);
}
contextPrototype.s = esmExport;
/**
 * Registers re-exports that all forward to properties of other modules.
 *
 * This is a compact spelling of the pattern
 *
 * ```js
 * var ns = context.i(moduleId)
 * context.s([exportName, () => ns[importedName], ...])
 * ```
 *
 * The list is a flat sequence of groups. Each group starts with the source the exports come from,
 * followed by that group's entries, and is terminated by the `0` sentinel (or the end of the list).
 *
 * The group head is either a **module id**, which is instantiated here:
 *
 * ```js
 * context.S([
 *   76061, 'default', 'f', 'named', 'A', 0,
 *   29842, 'otherModule', 'f',
 * ])
 * ```
 *
 * or the **namespace value** of a module that has already been imported, which is used directly:
 *
 * ```js
 * var ns1 = context.i(76061)
 * context.S([ns1, 'default', 'f', 'named', 'A'])
 * ```
 *
 * The producer picks the namespace form when it has generated the import anyway -- because some
 * later import must not be reordered past it -- so nothing is instantiated twice. The two are told
 * apart by type: a module id is always a string or number. A CommonJS function export produces a
 * callable namespace value, so namespace heads can be functions as well as objects.
 *
 * Entries are `exportName, importedName` pairs, except when a group holds exactly one string. That
 * string is then a comma-joined list of the same pairs, which saves the repeated quoting:
 *
 * ```js
 * context.S([
 *   76061, 'default,f,named,A', 0,
 *   29842, 'otherModule,f',
 * ])
 * ```
 *
 * The producer picks that spelling independently for each group whose names contain no commas,
 * since that group's names are recovered by splitting on them.
 *
 * Groups whose head is a module id are instantiated in list order, at the point where the call
 * appears, so the producer must not merge such a group across an import of another module. The
 * destination reuses a source data value or getter descriptor when one exists, falling back to a
 * wrapper getter for dynamic/proxy/inherited properties.
 *
 * `id` names the module the exports belong to when this module was merged into a scope-hoisting
 * group, exactly as it does for {@link EsmExport}.
 *
 * Only the source descriptor's payload (value or getter) is reused. {@link esm} still defines a
 * fresh enumerable, non-configurable destination property, and no source setter is ever forwarded.
 */ function esmReexport(list, id) {
    const bindings = [];
    let i = 0;
    while(i < list.length){
        const head = list[i++];
        const start = i;
        while(i < list.length && list[i] !== REEXPORT_GROUP_END)i++;
        const end = i;
        // Skip the sentinel, if this group was terminated by one rather than by the end of the list.
        i++;
        // Module ids are always strings or numbers. Other values are already-imported namespaces;
        // notably, interop with a CommonJS function export produces a callable namespace function.
        // `esmImport` may return a promise for an async module, but re-exports of async modules keep
        // going through `context.s`, so the producer never routes them here and this stays synchronous.
        const namespace = typeof head === 'string' || typeof head === 'number' ? esmImport.call(this, head) : head;
        if (end - start === 1) {
            const pairs = list[start].split(',');
            for(let j = 0; j < pairs.length; j += 2){
                appendReexportBinding(bindings, pairs[j], namespace, pairs[j + 1]);
            }
        } else {
            for(let j = start; j < end; j += 2){
                appendReexportBinding(bindings, list[j], namespace, list[j + 1]);
            }
        }
    }
    esmExport.call(this, bindings, id);
}
contextPrototype.S = esmReexport;
function appendReexportBinding(bindings, exportedName, namespace, importedName) {
    const descriptor = Reflect.getOwnPropertyDescriptor(namespace, importedName);
    if (descriptor) {
        if ('value' in descriptor) {
            // Code generation only routes immutable imported bindings through this helper, so a data
            // descriptor is a constant export and can be captured once.
            bindings.push(exportedName, BindingTag_Value, descriptor.value);
            return;
        }
        if (descriptor.get) {
            // Accessors remain live by reusing the source getter. `esmReexport` is only called by
            // generated code: every group head is either produced by
            // `this.i` or is the namespace variable from a generated `this.i` call. Every getter on such
            // a namespace is receiver-independent: ESM bindings are compiler-generated arrow functions,
            // and the CommonJS/dynamic-namespace paths create arrows in `createGetter` and
            // `getOwnPropertyDescriptor`. The destination can therefore reuse the exact function instead
            // of allocating another wrapper getter.
            bindings.push(exportedName, descriptor.get);
            return;
        }
    }
    // Dynamic/proxy/inherited CommonJS edge cases may not expose a usable own descriptor.
    bindings.push(exportedName, ()=>namespace[importedName]);
}
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        // Returns the re-exported object that provides `prop` as an own property,
        // or `undefined` if none does. The traps share this logic so they always
        // agree on which keys are synthesized from `reexportedObjects`. `default`
        // is never re-exported by `export *`, so it is never synthesized.
        const reexportOwning = (prop)=>{
            if (prop !== 'default') {
                for (const obj of reexportedObjects){
                    if (hasOwnProperty.call(obj, prop)) return obj;
                }
            }
            return undefined;
        };
        // Modules with dynamic re-exports are not sealed by `esm()`, so the
        // target beneath the namespace stays extensible. That is what lets the
        // `ownKeys` and `getOwnPropertyDescriptor` traps legally report keys that
        // exist on `reexportedObjects` but not on the target itself.
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                const obj = reexportOwning(prop);
                return obj && Reflect.get(obj, prop);
            },
            // The namespace is read-only, like a real esm namespace object. The
            // re-exported modules can still mutate their own exports (exposed live
            // via `get`), but mutating the namespace itself is rejected. Refusing
            // here, rather than forwarding to the extensible target, also prevents an
            // assignment/definition from shadowing a dynamic re-export. It also
            // prevents delete from removing a static export.
            set () {
                return false;
            },
            defineProperty () {
                return false;
            },
            deleteProperty () {
                return false;
            },
            // The `has` trap ensures that `'exportName' in starImports` will reflect
            // the truth of whether a key is exported.
            has (target, prop) {
                if (Reflect.has(target, prop)) return true;
                if (prop === 'default' || prop === '__esModule') return false;
                return reexportOwning(prop) !== undefined;
            },
            // ownKeys and getOwnPropertyDescriptor together make the keys enumerable.
            // If a value is returned from `ownKeys` but its property descriptor is
            // not enumerable, it will not be visible to iterator methods.
            // Collectively, they allow code like the following:
            //
            // ```
            // // module.js re-exports dynamic CJS exports
            // export * from './legacyModule.cjs'
            //
            // // from another JS file, reference the re-exported dynamic values
            // import * as Namespace from './module.js'
            // Object.keys(Namespace)
            // ```
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            },
            getOwnPropertyDescriptor (target, prop) {
                const own = Reflect.getOwnPropertyDescriptor(target, prop);
                if (own || prop === 'default' || prop === '__esModule') return own;
                const obj = reexportOwning(prop);
                if (obj) {
                    // Synthetic keys don't exist on the target, so they MUST be
                    // reported as configurable. However the set/delete traps above will
                    // prevent them from actually being changed
                    return {
                        enumerable: true,
                        configurable: true,
                        get: ()=>Reflect.get(obj, prop)
                    };
                }
                return undefined;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const bindings = [];
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            bindings.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = bindings.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            // Replace the getter with the value
            bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
        } else {
            bindings.push('default', BindingTag_Value, raw);
        }
    }
    esm(ns, bindings);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * Remove fragments and query parameters since they are never part of the context map keys
 *
 * This matches how we parse patterns at resolving time.  Arguably we should only do this for
 * strings passed to `import` but the resolve does it for `import` and `require` and so we do
 * here as well.
 */ function parseRequest(request) {
    // Per the URI spec fragments can contain `?` characters, so we should trim it off first
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.5
    const hashIndex = request.indexOf('#');
    if (hashIndex !== -1) {
        request = request.substring(0, hashIndex);
    }
    const queryIndex = request.indexOf('?');
    if (queryIndex !== -1) {
        request = request.substring(0, queryIndex);
    }
    return request;
}
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
// Load the CompressedModuleFactories of a chunk into the `moduleFactories` Map.
// The flat format alternates one or more module IDs with their factory function.
// Strict factories can be prepended as a nested array.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    const strictFactories = chunkModules[i];
    if (Array.isArray(strictFactories)) {
        installCompressedModuleFactories(strictFactories, 0, moduleFactories, newModuleId);
        i++;
    }
    while(i < chunkModules.length){
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Install the factory for each module ID that doesn't already have one.
        // When some IDs in this group already have a factory, reuse that existing
        // group factory for the missing IDs to keep all IDs in the group consistent.
        // Otherwise, install the factory from this chunk.
        const moduleFactoryFn = chunkModules[end];
        let existingGroupFactory = undefined;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            const existingFactory = moduleFactories.get(id);
            if (existingFactory) {
                existingGroupFactory = existingFactory;
                break;
            }
        }
        const factoryToInstall = existingGroupFactory ?? moduleFactoryFn;
        let didInstallFactory = false;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            if (!moduleFactories.has(id)) {
                if (!didInstallFactory) {
                    if (factoryToInstall === moduleFactoryFn) {
                        applyModuleFactoryName(moduleFactoryFn);
                    }
                    didInstallFactory = true;
                }
                moduleFactories.set(id, factoryToInstall);
                newModuleId?.(id);
            }
        }
        i = end + 1;
    }
}
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * Constructs an error message for when a module factory is not available.
 */ function factoryNotAvailableMessage(moduleId, sourceType, sourceData) {
    let instantiationReason;
    switch(sourceType){
        case 0:
            instantiationReason = `as a runtime entry of chunk ${sourceData}`;
            break;
        case 1:
            instantiationReason = `because it was required from module ${sourceData}`;
            break;
        case 2:
            instantiationReason = 'because of an HMR update';
            break;
        default:
            invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
    }
    return `Module ${moduleId} was instantiated ${instantiationReason}, but the module factory is not available.`;
}
/**
 * Returns a `file://` URL under a synthetic directory named after `root`
 * (`ROOT` for the project root), for when the real filesystem path is unknown.
 * The root name and path segments are percent-encoded so the result is always
 * a valid file URI.
 */ function placeholderFileUrl(modulePath, root) {
    return `file:///${encodeURIComponent(root ?? 'ROOT')}/${modulePath.split('/').map(encodeURIComponent).join('/')}`;
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: 'module evaluation'
    });
}
/// <reference path="../shared/runtime/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/**
 * Returns an absolute `file://` URL for the given module path, which is
 * relative to the project root or the named `root`.
 *
 * Uses `url.pathToFileURL` so that the resulting URL is a valid file URI on
 * all platforms (forward slashes on Windows, drive letters handled
 * correctly, path segments URL-encoded).
 *
 * The location of a named `root` isn't known at runtime (the output may have
 * been moved away from the sources), so this returns a placeholder URL for it.
 */ function resolveFileUrl(modulePath, root) {
    if (root !== undefined) {
        return placeholderFileUrl(modulePath, root);
    }
    return require('url').pathToFileURL(resolveAbsolutePath(modulePath)).href;
}
Context.prototype.F = resolveFileUrl;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../../shared/runtime/runtime-utils.ts" />
/// <reference path="../../shared-node/base-externals-utils.ts" />
/// <reference path="../../shared-node/node-externals-utils.ts" />
/// <reference path="./nodejs-globals.d.ts" />
/**
 * Base Node.js runtime shared between production and development.
 * Contains chunk loading, module caching, and other non-HMR functionality.
 */ process.env.TURBOPACK = '1';
const url = require('url');
const moduleFactories = new Map();
const moduleCache = new Map();
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
/**
 * Exports a URL value. No suffix is added in Node.js runtime.
 */ function exportUrl(urlValue, id) {
    exportValue.call(this, urlValue, id);
}
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
    loadedChunks.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (cause) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        const error = new Error(errorMessage, {
            cause
        });
        error.name = 'ChunkLoadError';
        throw error;
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (cause) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            const error = new Error(errorMessage, {
                cause
            });
            error.name = 'ChunkLoadError';
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(error);
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
// Shared runtime primitive: the root that on-disk chunk paths are resolved
// against. Used by the bundled wasm helper (exposed as `__turbopack_runtime_root__`).
contextPrototype.w = RUNTIME_ROOT;
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-base.ts" />
/**
 * Production Node.js runtime.
 * Uses ModuleWithDirection and simple module instantiation without HMR support.
 */ // moduleCache and moduleFactories are declared in runtime-base.ts
// this is read in runtime-utils.ts so it creates a module with direction for hmr
createModuleWithDirectionFlag = true;
const nodeContextPrototype = Context.prototype;
nodeContextPrototype.q = exportUrl;
nodeContextPrototype.M = moduleFactories;
// Cast moduleCache to ModuleWithDirection for production mode
nodeContextPrototype.c = moduleCache;
nodeContextPrototype.R = resolvePathFromModule;
nodeContextPrototype.C = clearChunkCache;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        throw new Error(factoryNotAvailableMessage(id, sourceType, sourceData));
    }
    const module1 = createModuleWithDirection(id);
    const exports = module1.exports;
    moduleCache.set(id, module1);
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    ;
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache.get(id);
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, SourceType.Parent, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, SourceType.Runtime, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache.get(moduleId);
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/ssr/[root-of-the-server]__0j8iu330o-51s._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0j8iu330o-51s._.js");
      case "server/chunks/ssr/[root-of-the-server]__11nxi3t4cop6c._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__11nxi3t4cop6c._.js");
      case "server/chunks/ssr/[root-of-the-server]__14s3j6_m-dq2s._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__14s3j6_m-dq2s._.js");
      case "server/chunks/ssr/[root-of-the-server]__1cf6qt9agg_9-._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1cf6qt9agg_9-._.js");
      case "server/chunks/ssr/[root-of-the-server]__1r0xhh-8a4_0r._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1r0xhh-8a4_0r._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/_18mmh87u__yjg._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_18mmh87u__yjg._.js");
      case "server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yrisjoev.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yrisjoev.js");
      case "server/chunks/ssr/components_04emyfn6_5lg7._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/components_04emyfn6_5lg7._.js");
      case "server/chunks/ssr/lib_api_0-ida46zexju-.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/lib_api_0-ida46zexju-.js");
      case "server/chunks/ssr/lib_data_0i0defmnqch1m.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/lib_data_0i0defmnqch1m.js");
      case "server/chunks/ssr/lib_supabase_0r37yf820ndke.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/lib_supabase_0r37yf820ndke.js");
      case "server/chunks/ssr/node_modules_0e7ga4fe7dl9y._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0e7ga4fe7dl9y._.js");
      case "server/chunks/ssr/node_modules_0h91jdk0pr40d._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0h91jdk0pr40d._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_08zge1rim4vfr._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_08zge1rim4vfr._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_019_y6t0ynczf._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_019_y6t0ynczf._.js");
      case "server/chunks/ssr/node_modules_next_19misn5bvv8e7._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_19misn5bvv8e7._.js");
      case "server/chunks/ssr/node_modules_next_dist_0janj0i6dqko7._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0janj0i6dqko7._.js");
      case "server/chunks/ssr/node_modules_next_dist_1khq67j4vo9y4._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1khq67j4vo9y4._.js");
      case "server/chunks/ssr/node_modules_next_dist_20w9fuchy6ao8._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_20w9fuchy6ao8._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j32_ibz4._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j32_ibz4._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9mbf-fh.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9mbf-fh.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0xky89qu.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0xky89qu.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_00i_jmlq-i-rl.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_00i_jmlq-i-rl.js");
      case "server/chunks/ssr/[root-of-the-server]__0py1t7q9ntzgc._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0py1t7q9ntzgc._.js");
      case "server/chunks/ssr/[root-of-the-server]__0urceghikf0g-._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0urceghikf0g-._.js");
      case "server/chunks/ssr/[root-of-the-server]__1-3183r4leyo5._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1-3183r4leyo5._.js");
      case "server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-psc_d2.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-psc_d2.js");
      case "server/chunks/ssr/node_modules_0gxlxpuufujz9._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0gxlxpuufujz9._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13q04th-918ib.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13q04th-918ib.js");
      case "server/chunks/ssr/[root-of-the-server]__0gzb0oshn414y._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0gzb0oshn414y._.js");
      case "server/chunks/ssr/_next-internal_server_app_about_page_actions_0xvgj076vz0b3.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_about_page_actions_0xvgj076vz0b3.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892nagajq.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892nagajq.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0r7_m3v-30mgd.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0r7_m3v-30mgd.js");
      case "server/chunks/ssr/[root-of-the-server]__132wry-4e53pf._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__132wry-4e53pf._.js");
      case "server/chunks/ssr/_next-internal_server_app_add-listing_page_actions_0zlx7z4tn9drv.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_add-listing_page_actions_0zlx7z4tn9drv.js");
      case "server/chunks/ssr/app_add-listing_06a_3ok7tbe_7._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_add-listing_06a_3ok7tbe_7._.js");
      case "server/chunks/ssr/node_modules_leaflet_dist_leaflet-src_0j855cnmdbymz.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_leaflet_dist_leaflet-src_0j855cnmdbymz.js");
      case "server/chunks/ssr/node_modules_leaflet_dist_leaflet-src_1de3iy2560t96.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_leaflet_dist_leaflet-src_1de3iy2560t96.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1f2hn73jjy69d.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1f2hn73jjy69d.js");
      case "server/chunks/ssr/[root-of-the-server]__1k_hrdy347w99._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1k_hrdy347w99._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_page_actions_1mcickzfofbmo.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_page_actions_1mcickzfofbmo.js");
      case "server/chunks/ssr/app_admin_page_0nn9bn9hqs88g.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_admin_page_0nn9bn9hqs88g.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0hclitezi5_vu.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0hclitezi5_vu.js");
      case "server/chunks/ssr/[root-of-the-server]__1cy7j3ouww2wa._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1cy7j3ouww2wa._.js");
      case "server/chunks/ssr/_next-internal_server_app_auth_page_actions_1ubynkgwwy3t7.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_auth_page_actions_1ubynkgwwy3t7.js");
      case "server/chunks/ssr/app_auth_page_0tobvllvqge7o.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_auth_page_0tobvllvqge7o.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0rehpsmnh5s2k._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0rehpsmnh5s2k._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1rbanjet72wcs.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1rbanjet72wcs.js");
      case "server/chunks/ssr/[root-of-the-server]__1s8qehi7i9fc3._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1s8qehi7i9fc3._.js");
      case "server/chunks/ssr/_next-internal_server_app_auth_reset_page_actions_10x4pww6b9zot.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_auth_reset_page_actions_10x4pww6b9zot.js");
      case "server/chunks/ssr/app_auth_reset_page_0yinadm--fa-p.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_auth_reset_page_0yinadm--fa-p.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_lock_mjs_1gm6iultm3axq._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_lock_mjs_1gm6iultm3axq._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_02f6876wbvw_p.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_02f6876wbvw_p.js");
      case "server/chunks/ssr/[root-of-the-server]__1apa9jrsd29lw._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1apa9jrsd29lw._.js");
      case "server/chunks/ssr/_0q94_mw1wysk1._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_0q94_mw1wysk1._.js");
      case "server/chunks/ssr/_0w4g0hk9gd2vg._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_0w4g0hk9gd2vg._.js");
      case "server/chunks/ssr/_next-internal_server_app_browse_page_actions_14lkmqqcfv4lb.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_browse_page_actions_14lkmqqcfv4lb.js");
      case "server/chunks/ssr/app_browse_page_19evrahlc-5bl.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_browse_page_19evrahlc-5bl.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1_j5wrcjbuu4l.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1_j5wrcjbuu4l.js");
      case "server/chunks/ssr/[root-of-the-server]__1z59ac0afhw_-._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1z59ac0afhw_-._.js");
      case "server/chunks/ssr/_next-internal_server_app_commercial_page_actions_0x61y491sv38y.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_commercial_page_actions_0x61y491sv38y.js");
      case "server/chunks/ssr/app_commercial_page_0-ogmhybui8h_.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_commercial_page_0-ogmhybui8h_.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0noeah0-2rcxl.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0noeah0-2rcxl.js");
      case "server/chunks/ssr/[root-of-the-server]__04wt_0qhu0t88._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__04wt_0qhu0t88._.js");
      case "server/chunks/ssr/_0uf8s5tlcc4nf._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_0uf8s5tlcc4nf._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_admin_page_actions_1471gda0ttzxh.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_admin_page_actions_1471gda0ttzxh.js");
      case "server/chunks/ssr/app_dashboard_admin_page_15fkx530iwmb5.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_dashboard_admin_page_15fkx530iwmb5.js");
      case "server/chunks/ssr/app_dashboard_layout_0ek853zmfs0tq.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_dashboard_layout_0ek853zmfs0tq.js");
      case "server/chunks/ssr/app_dashboard_layout_0xx02cuqy8bgj.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_dashboard_layout_0xx02cuqy8bgj.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_02fiyf_910v0k.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_02fiyf_910v0k.js");
      case "server/chunks/ssr/[root-of-the-server]__0afoca6nygkej._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0afoca6nygkej._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_edit_[id]_page_actions_196z1qnzf-q5w.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_edit_[id]_page_actions_196z1qnzf-q5w.js");
      case "server/chunks/ssr/app_dashboard_edit_[id]_page_17mntnni7c_y2.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_dashboard_edit_[id]_page_17mntnni7c_y2.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_trash_mjs_0px2gzry_9y7z._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_trash_mjs_0px2gzry_9y7z._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_15b3z340ses1g.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_15b3z340ses1g.js");
      case "server/chunks/ssr/[root-of-the-server]__1-1gw0aqepr1m._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1-1gw0aqepr1m._.js");
      case "server/chunks/ssr/_1wgqwj-p1zmxc._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_1wgqwj-p1zmxc._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_new_page_actions_0ixgatx7l-sl2.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_new_page_actions_0ixgatx7l-sl2.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_153jtngj1piax.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_153jtngj1piax.js");
      case "server/chunks/ssr/[root-of-the-server]__1usqwc300lu8d._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1usqwc300lu8d._.js");
      case "server/chunks/ssr/_1uwrx2kdui3ba._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_1uwrx2kdui3ba._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_page_actions_10dr1c56aj99-.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_page_actions_10dr1c56aj99-.js");
      case "server/chunks/ssr/app_dashboard_page_0dlvsztnqlo0u.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_dashboard_page_0dlvsztnqlo0u.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10-4cbsa_hx8u.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10-4cbsa_hx8u.js");
      case "server/chunks/ssr/[root-of-the-server]__1ps1c3pn63hff._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1ps1c3pn63hff._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_profile_page_actions_1r4ihcbrfim-y.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_profile_page_actions_1r4ihcbrfim-y.js");
      case "server/chunks/ssr/app_dashboard_profile_page_0b9zkc-bvd6c9.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_dashboard_profile_page_0b9zkc-bvd6c9.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0fbcwn2h5ax4w.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0fbcwn2h5ax4w.js");
      case "server/chunks/[externals]__12s2uxrv8n30f._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/[externals]__12s2uxrv8n30f._.js");
      case "server/chunks/[root-of-the-server]__16givbh587ghw._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__16givbh587ghw._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/_next-internal_server_app_favicon_ico_route_actions_0g2jjlssn1kss.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_favicon_ico_route_actions_0g2jjlssn1kss.js");
      case "server/chunks/ssr/[root-of-the-server]__17ym2bhdlx68c._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__17ym2bhdlx68c._.js");
      case "server/chunks/ssr/_0vj8sj25ce1ro._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_0vj8sj25ce1ro._.js");
      case "server/chunks/ssr/_next-internal_server_app_favorites_page_actions_1ih2-e1f9no5i.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_favorites_page_actions_1ih2-e1f9no5i.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10lq09ohwxxaa.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10lq09ohwxxaa.js");
      case "server/chunks/ssr/[root-of-the-server]__1bo3h5e7b_3ss._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1bo3h5e7b_3ss._.js");
      case "server/chunks/ssr/_0yckv96w10bov._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_0yckv96w10bov._.js");
      case "server/chunks/ssr/_1aau59g7_iftq._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_1aau59g7_iftq._.js");
      case "server/chunks/ssr/_1b6vs6mhxx1yn._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_1b6vs6mhxx1yn._.js");
      case "server/chunks/ssr/_next-internal_server_app_listing_[id]_page_actions_17lmrw2llv51g.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_listing_[id]_page_actions_17lmrw2llv51g.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0r8sbl21lu5wz.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0r8sbl21lu5wz.js");
      case "server/chunks/ssr/[root-of-the-server]__1z4m-wkjg94cv._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1z4m-wkjg94cv._.js");
      case "server/chunks/ssr/_next-internal_server_app_my-listings_page_actions_1ktpol8oz17fe.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_my-listings_page_actions_1ktpol8oz17fe.js");
      case "server/chunks/ssr/app_my-listings_page_1krw_8v-z-ex4.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_my-listings_page_1krw_8v-z-ex4.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_16v_5bi-m8lfg.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_16v_5bi-m8lfg.js");
      case "server/chunks/ssr/[root-of-the-server]__0gtjfh_deuwvm._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0gtjfh_deuwvm._.js");
      case "server/chunks/ssr/_064s-p5azkr2e._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_064s-p5azkr2e._.js");
      case "server/chunks/ssr/_0rdzeg4jpjdhy._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_0rdzeg4jpjdhy._.js");
      case "server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1jew5ls7.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1jew5ls7.js");
      case "server/chunks/ssr/components_212d-n3ih4ucs._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/components_212d-n3ih4ucs._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0_odlf05ji1i7.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0_odlf05ji1i7.js");
      case "server/chunks/ssr/[root-of-the-server]__1pmul-9qjkly8._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1pmul-9qjkly8._.js");
      case "server/chunks/ssr/_next-internal_server_app_profile_me_page_actions_1_a790f4ind5x.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_profile_me_page_actions_1_a790f4ind5x.js");
      case "server/chunks/ssr/app_profile_me_page_1_15y2kurh6c1.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_profile_me_page_1_15y2kurh6c1.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0znkb3sz28e13.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0znkb3sz28e13.js");
      case "server/chunks/ssr/[root-of-the-server]__0u1xgv_wj1ldz._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0u1xgv_wj1ldz._.js");
      case "server/chunks/ssr/_next-internal_server_app_profile_page_actions_1b7qq3ldsteje.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_profile_page_actions_1b7qq3ldsteje.js");
      case "server/chunks/ssr/app_profile_1rx732ymu053q._.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/app_profile_1rx732ymu053q._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0uf_tdgi49fbr.js": return require("/home/boot/Desktop/aqar-hosh-eissa-website/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0uf_tdgi49fbr.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {

      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }
