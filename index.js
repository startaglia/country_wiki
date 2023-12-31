import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express();
const port = 8000;
const ALL_API_URL = "https://restcountries.com/v3.1/";
const NAME_API_URL = "https://restcountries.com/v3.1/name/";
const CAPITAL_API_URL = "https://restcountries.com/v3.1/capital/";
const LANGUAGE_API_URL = "https://restcountries.com/v3.1/lang/";
const REGION_API_URL = "https://restcountries.com/v3.1/region/";
const SUBREGION_API_URL = "https://restcountries.com/v3.1/subregion/";
let apiData;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//create arrays with all data for list_results
async function fetchAllValues() {
    try {
        const response = await axios.get(ALL_API_URL + "all");
        const countries = response.data;
        const names = new Set();
        const capitals = new Set();
        const languages = new Set();
        const regions = new Set();
        const subregions = new Set();

        countries.forEach(country => {
            if (country.name.common) {
                names.add(country.name.common);
            }
            if (country.capital) {
                if (Array.isArray(country.capital)) {
                    country.capital.forEach(capital => capitals.add(capital));
                } else {
                    capitals.add(country.capital);
                }
            }
            if (country.languages) {
                const languageValues = Array.isArray(country.languages)
                    ? country.languages.map(language => language)
                    : Object.values(country.languages);
                languageValues.forEach(language => languages.add(language));
            }
            if (country.region) {
                regions.add(country.region);
            }
            if (country.subregion) {
                subregions.add(country.subregion);
            }
        });
        return {
            names:      Array.from(names).sort(),
            capitals:   Array.from(capitals).sort(),
            languages:  Array.from(languages).sort(),
            regions:    Array.from(regions).sort(),
            subregions: Array.from(subregions).sort()
        };
    } catch (error) {
        console.error("API request error:", error);
        throw error;
    }
}

app.get("/", async (req, res)=>{
    try {
        const response = await axios.get(ALL_API_URL + "all");
        apiData = response.data;

        res.render("index.ejs", {
            content:    apiData,
        });
    } catch (error) {
        res.status(500).send(`Country request error`);
    }
});
app.post("/", (req, res)=> {
    const searchType = req.body.searchType;
    res.redirect(`/search_type?searchType=${searchType}`);
});
app.get("/search_type", async (req, res)=>{
    const searchType = req.query.searchType;
    const allValues = await fetchAllValues();
    res.render("search_type.ejs", {
        content:    searchType,
        names:      allValues.names,
        capitals:   allValues.capitals,
        languages:  allValues.languages,
        regions:    allValues.regions,
        subregions: allValues.subregions,
        });
});
app.post("/search_type", async (req, res) => {
    const searchTerm = req.body.searchTerm;
    const searchType = req.body.searchType;

    try {
        let response;
        switch (searchType) {
            case 'name':
                response = await axios.get(NAME_API_URL + searchTerm);
                apiData = response.data;
                if (apiData.length > 0) {
                    res.redirect(`/result?country=${apiData[0].name.common}`);
                } else {
                    res.status(404).send('No country found with this name.');
                }
                break;
            case 'capital':
                response = await axios.get(CAPITAL_API_URL + searchTerm);
                apiData = response.data;
                if (apiData.length > 0) {
                    res.redirect(`/result?country=${apiData[0].name.common}`);
                } else {
                    res.status(404).send('No country found with this name.');
                }
                break;
            default:
                res.redirect(`/list_results?searchType=${searchType}&searchTerm=${searchTerm}`);
                break;
        }
    } catch (error) {
        console.error('API request error:', error);
        res.status(500).send('Country request error.');
    }
});
app.get("/list_results", async (req, res)=>{
    try {
        const searchTerm = req.query.searchTerm;
        const searchType = req.query.searchType;
        let response;
        switch (searchType) {
            case 'language':
                response = await axios.get(LANGUAGE_API_URL + searchTerm);
                apiData = response.data;
                res.render("list_results.ejs", {
                    content:    apiData,
                    type :      searchType,
                    term:       searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1),
                });
                break;
            case 'region':
                response = await axios.get(REGION_API_URL + searchTerm);
                apiData = response.data;
                res.render("list_results.ejs", {
                    content:    apiData,
                    type :      searchType,
                    term:       searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1),
                });
                break;
            case 'subregion':
                response = await axios.get(SUBREGION_API_URL + searchTerm);
                apiData = response.data;
                res.render("list_results.ejs", {
                    content:    apiData,
                    type :      searchType,
                    term:       searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1),
                });
                break;
            default:
                res.status(400).send('API request error');
                break;
        }
    } catch (error) {
        res.status(500).send(`Country request error`);
    }
});
app.get("/country_list", async (req, res)=>{
    try {
        const response = await axios.get(ALL_API_URL + "all");
        apiData = response.data;

        res.render("country_list.ejs", {
            content:    apiData,
        });
    } catch (error) {
        res.status(500).send(`Country request error`);
    }
});
app.post("/country_list", (req, res)=>{
    const country = req.body.country;
    res.redirect(`/result?country=${country}`);
});
app.get("/result", async (req, res) => {
    try {
        const countryName = req.query.country;
        //find selected country
        const selectedCountry = apiData.find(item => item.name.common === countryName);

        if (selectedCountry) {
            res.render("result.ejs", {
                country: selectedCountry,
            });
        } else {
            res.status(404).send("Country not found");
        }
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});
app.listen(port, ()=> {
    console.log(`Server running on port ${port}`);
});
