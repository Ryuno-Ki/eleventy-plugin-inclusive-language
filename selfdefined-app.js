function request (url) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "11ty-inclusive-language-linter"
    };

    https.get(url, { headers }, (res) => {
      const { statusCode } = res;
      let error = null

      if (statusCode !== 200) {
	console.debug(url)
        error = new Error("Could not fetch data!");
      }

      let rawData = "";

      res.on("data", (chunk) => rawData += chunk);
      res.on("end", () => {
        if (error) {
	  console.error(rawData);
	  res.resume();
	  return reject(error);
	}

        try {
	  return resolve(JSON.parse(rawData));
	} catch (exc) {
	  return reject(exc);
	}
      });
    });
  });
}

function checkRateLimit () {
  const url = "https://api.github.com/rate_limit"
  return request(url)
}


function getTree () {
  const url = "https://api.github.com/repos/tatianamac/selfdefined/git/trees/master"
  return request(url)
}

function get11ty (tree) {
  const eleventy = tree.filter((branch) => branch.path === "11ty");
  if (eleventy.length === 0) {
    return Promise.reject(new Error("Could not find 11ty directory!"));
  }
  return request(eleventy[0].url);
}

function getDefinitions (tree) {
  const definitions = tree.filter((branch) => branch.path === "definitions");
  if (definitions.length === 0) {
    return Promise.reject(new Error("Could not find definitions directory!"));
  }
  console.log('URL', definitions[0].url)
  return request(definitions[0].url);
}

function getFiles (tree) {
  const files = tree.filter((branch) => branch.type === "blob");
  if (files.length === 0) {
    return Promise.reject(new Error("Could not find files!"));
  }
  return Promise.all(files.map((file) => request(file.url)))
}

function getYamlFiles () {
  return checkRateLimit()
    .then((response) => {
      console.log('Rate limit', response.resources.core)
      console.log('Reset at ' + new Date(response.resources.core.reset * 1000))
      return Promise.resolve(true)
    })
    .then(() => getTree())
    .then((response) => get11ty(response.tree))
    .then((response) => getDefinitions(response.tree))
    .then((response) => getFiles(response.tree))
    .then((response) => {
      console.log(response)
      return Promise.resolve(true)
    })
    .catch((error) => console.error(error))
}

module.exports = getYamlFiles
