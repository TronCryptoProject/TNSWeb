from bs4 import BeautifulSoup as Soup 

with open("../APIBlueprint.html", "r") as in_file:
    filedata = in_file.read()
    soup = Soup(filedata, features="lxml")
    top_right_div = soup.select_one(".container-fluid.triple .row .content .right")
    top_right_div.clear()
    print ("first", top_right_div)
    title_div = soup.new_tag("h5")
    title_div["style"] = "font-size: 3em;text-align: center;"
    title_div.string = "API Documentation"
    top_right_div.append(title_div)

    svg_div = soup.new_tag("object")
    svg_div["type"] = "image/svg+xml"
    svg_div["data"] = "./images/tron_logo_shadow_white.svg"
    top_right_div.append(svg_div)

    print(top_right_div)

    html = str(soup)
    with open("../APIBlueprint.html", "w") as out_file:
        out_file.write(html)

    '''
     <h5 style="font-size: 3em;text-align: center;">API Documentation</h5><a></a>
    <object type="image/svg+xml" data="/images/tron_logo_shadow_white.svg"></object>'''
