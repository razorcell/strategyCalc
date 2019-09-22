// const Main = require('./app_modules/main.js');
const logger = require("./logger.js");
const cheerio = require("cheerio");
const tor = require("./tor.js");
const file = require("./file.js");

const CATEGORIES_NAMES = [
  "Valores de Titularización de Contenido Crediticio",
  "Pagarés Bursátiles",
  "Bonos Bancarios Bursátiles",
  "Pagarés de Mesa de Negociación",
  "Cuotas de Fondos de Inversión Cerrados",
  "Bonos de Largo Plazo",
  "Bonos Municipales"
];

const CATEGORIES = [
  "Valores+de+Titularizaci%C3%B3n+de+Contenido+Crediticio",
  "Pagar%C3%A9s+Burs%C3%A1tiles",
  "Bonos+Bancarios+Burs%C3%A1tiles",
  "Pagar%C3%A9s+de+Mesa+de+Negociaci%C3%B3n",
  "Cuotas+de+Fondos+de+Inversi%C3%B3n+Cerrados",
  "Bonos+de+Largo+Plazo",
  "Bonos+Municipales"
];

module.exports = {
  getParaguayUpdates,
  getItalyBonds,
  getBoliviaBonds
};

function getBoliviaBonds() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let all_data = new Array();
        await Promise.all(
          CATEGORIES.map(async (category, index) => {
            logger.general_log.info(
              `Get Bolivia bonds for category : ${CATEGORIES_NAMES[index]}`
            );
            let this_page_data = await getBoliviaBondsInCategory(
              index,
              category
            );
            all_data = all_data.concat(this_page_data);
          })
        );
        resolve(all_data);
      } catch (err) {
        logger.general_log.error(`Bolivia: getBoliviaBonds ${err.message}`);
        reject(`Bolivia: getBoliviaBonds`);
      }
    })();
  });
}

function getBoliviaBondsInCategory(index, category) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let URI = `https://www.bbv.com.bo:11113/Prospectos?Prospecto.Tipo=${category}`;
        var response = await tor.downloadUrlUsingTor(URI);
        file.writeToFile("downloads/test.html", response.body);
        const $ = cheerio.load(response.body);
        let table_rows = $("table > tbody > tr").get();
        let bonds_list = $(table_rows).map((i, tr) => {
          let label = $(tr)
            .find("td:nth-child(1)")
            .text()
            .trim();
          let date = $(tr)
            .find("td:nth-child(2)")
            .text()
            .trim();
          let Caracteristicas = $(tr)
            .find("td:nth-child(3) > a")
            .attr("href");
          // .trim();
          let Prospecto = $(tr)
            .find("td:nth-child(4) > a")
            .attr("href");
          // .trim();
          //https://www.bbv.com.bo:11113/Content/Uploads/2019_CAR_VTD_PMJ.pdf
          return {
            category: CATEGORIES_NAMES[index],
            label: label,
            date: date,
            Caracteristicas: `<a href="https://www.bbv.com.bo:11113${Caracteristicas}">Caracteristicas</a>`,
            Prospecto: `<a href="https://www.bbv.com.bo:11113${Prospecto}">Prospecto</a>`
          };
        });
        resolve(bonds_list.get());
      } catch (err) {
        logger.general_log.error(`Error downloading Bonds List ${err.message}`);
        reject(`Error downloading Bonds List ${err.message}`);
      }
    })();
  });
}

function getItalyBonds() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let all_data = new Array();
        let end_reached = false;
        let page_id = 1;
        while (!end_reached) {
          logger.general_log.info(`Get Italy bonds page : ${page_id}`);
          let this_page_data = await getItalyBondsInPage(page_id);
          //Somehow the previous line returns an Object instead of array, so this line is necessary
          this_page_data = this_page_data.get();
          logger.general_log.info(
            `[${this_page_data.length}] Bonds in this page`
          );
          if (this_page_data.length < 1) {
            end_reached = true;
            logger.general_log.info(`END REACHED`);
            // console.log(all_data);
            logger.general_log.info(`Total rows extracted=${all_data.length}`);
            // console.log(all_data);
            resolve(all_data);
          } else {
            // console.log("this_page_data=");
            // console.log(this_page_data);
            all_data = all_data.concat(this_page_data);
            // logger.general_log.info(`temp total=${all_data.length}`);
            page_id++;
          }
        }
      } catch (err) {
        logger.general_log.error(`Italy: getItalyBondsInPage ${err.message}`);
        reject(`Italy: getItalyBondsInPage`);
      }
    })();
  });
}

function getItalyBondsInPage(page_id) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let size = 2000;
        let URI = `https://www.borsaitaliana.it/borsa/obbligazioni/advanced-search.html?page=${page_id}&size=${size}&lang=it`;
        var response = await tor.downloadUrlUsingTor(URI);
        file.writeToFile("downloads/test.html", response.body);
        const $ = cheerio.load(response.body);
        let trs_ignore_first_two = $("table.m-table > tbody > tr")
          .get()
          .slice(2);
        let filter = new RegExp("[\\t\\n\\r\\f\\v]", "gm");
        let isinRegex = new RegExp("([A-Z]{2})([A-Z0-9]{9,11})", "gm");
        let isin_label_array = $(trs_ignore_first_two).map((i, tr) => {
          let isin = $(tr)
            .find("td:nth-child(1) a span")
            .text()
            .replace(filter, "")
            .match(isinRegex)[0];
          let label = $(tr)
            .find("td:nth-child(2) span")
            .text()
            .replace(filter, "");
          return { isin: isin, label: label };
        });
        resolve(isin_label_array);
      } catch (err) {
        logger.general_log.error(`Error downloading Bonds List ${err.message}`);
        reject(`Error downloading Bonds List ${err.message}`);
      }
    })();
  });
}

function getParaguayUpdates() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        //---------------STEP 1 EXTRACTING BONDS LINKS ---------------
        logger.general_log.info(`Extracting Bonds list`);
        let bonds_list = await getBondsList();
        // if (bonds_list.length < 10) {
        //   logger.general_log.error(`bonds_list.length < 10`);
        //   reject(`bonds_list.length < 10`);
        // }
        //---------------STEP 2 EXTRACTING DOCS DATA ---------------
        logger.general_log.info(`Extracting Docs lists`);
        let final_data = await getAllBondsData(bonds_list);
        //---------------STEP 3 END ---------------
        if (final_data.length > 30) {
          resolve(final_data);
        } else {
          logger.general_log.error(`final_data.length < 30`);
          reject(final_data);
        }
      } catch (err) {
        reject(err.message);
      }
    })();
  });
}

function getBondsList() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let first_page = "http://www.bvpasa.com.py/emisores.php";
        let base_url = "http://www.bvpasa.com.py/";
        var response = await tor.downloadUrlUsingTor(first_page);
        file.writeToFile("downloads/first_page.html", response.body);
        const $ = cheerio.load(response.body);
        let bonds_list = $("#tableEmisores > tbody tr")
          .map((i, tr) => {
            let localcode = $(tr)
              .find("td:nth-child(1)")
              .text();
            let label = $(tr)
              .find("td:nth-child(2)")
              .text();
            let link =
              base_url +
              $(tr)
                .find("td:nth-child(4) > a")
                .attr("href");
            return { localcode: localcode, label: label, link: link, docs: {} };
          })
          .get();
        resolve(bonds_list);
      } catch (err) {
        logger.general_log.error(`Step 1: Downloading the firt list of bonds`);
        reject(`Step 1: Downloading the firt list of bonds`);
      }
    })();
  });
}

function getAllBondsData(bonds_list) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let all_bonds_data = await Promise.all(
          bonds_list.map(async security => {
            try {
              // logger.general_log.info('processing link : ' + security.link);
              let all_docs = await getListDocsForOneSecurity(security);
              return {
                localcode: security.localcode,
                label: security.label,
                link: security.link,
                docs: all_docs
              };
            } catch (err) {
              logger.general_log.error("Error : " + err.message);
            }
          })
        );
        resolve(all_bonds_data);
      } catch (err) {
        logger.general_log.error(`Step2: getting all docs: ${err.message}`);
        reject(`Step2: getting all docs: ${err.message}`);
      }
    })();
  });
}

function getListDocsForOneSecurity(security) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let response = await tor.downloadUrlUsingTor(security.link);
        file.writeToFile(`downloads/${security.localcode}.html`, response.body);
        const $ = cheerio.load(response.body);
        let docs = $("div.sec-info > table")
          .last()
          .find("tbody > tr > td:nth-child(2) a")
          .map(function(i, elem) {
            return $(elem).text();
          })
          .get();
        resolve(docs);
      } catch (err) {
        logger.general_log.error(
          `Error downloading Docs for : ${security.localcode} at link: ${security.link}`
        );
        reject(
          `Error downloading Docs for : ${security.localcode} at link: ${security.link}`
        );
      }
    })();
  });
}
//2 - compile data in first page into array / object

//3 - foreach link in array

//3 - 1 got to link

//3 - 2 extract documents list

//3 - 3 push list to our array / object

//4 - foreach security in the list cross check updates in the database
//......
