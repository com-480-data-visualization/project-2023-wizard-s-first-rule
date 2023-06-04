# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Keller Paul | 242532 |
| Eynard Eloi | 296426 |
| Massonnet Dayan | 300882 |

[Milestone 1](#milestone-1-7th-april-5pm) • [Milestone 2](#milestone-2-7th-may-5pm) • [Milestone 3](#milestone-3-4th-june-5pm)

## Milestone 1 (7th April, 5pm)

**10% of the final grade**

### Dataset

We chose the dataset ["Video Game Sales with Ratings"](https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings). This Kaggle dataset, contains information about video game sales, ratings, and other relevant details. It aims to provide insights into the video game industry's trends and patterns, as well as the factors that influence a game's success in terms of sales and reception.

The dataset consists of several attributes for each video game, including:
- Name: The title of the video game.
- Platform: The gaming console or system on which the game is available.
- Year_of_Release: The year in which the game was released.
- Genre: The game's genre (e.g., Action, Adventure, Sports, etc.).
- Publisher: The company that published the game.
- NA_Sales: Sales in North America (in millions of units).
- EU_Sales: Sales in Europe (in millions of units).
- JP_Sales: Sales in Japan (in millions of units).
- Other_Sales: Sales in other regions (in millions of units).
- Global_Sales: Total worldwide sales (in millions of units).
- Critic_Score: Aggregate score compiled from various critic reviews (range: 0-100).
- Critic_Count: The number of critics who contributed to the critic score.
- User_Score: Aggregate score compiled from user reviews (range: 0-10).
- User_Count: The number of users who contributed to the user score.
- Developer: The company or team responsible for developing the game.
- Rating: The game's rating according to the Entertainment Software Rating


### Problematic

Our objective with this dataset is to analyze how video games function across different regions. We acknowledge that cultural differences vary across regions and it would be intriguing to observe how these differences impact video games, which are primarily designed for a universal audience. In addition to this, we can also examine the evolution of video games based on the console they are played on. It would also be interesting to analyse the popularity of certain game consoles dependent on the region, some being handheld and low budget, and other being more expensive consoles for bigger screens.

### Exploratory Data Analysis

We have done some intial analysis of the dataset in a [jupyter notebook file](vg_sales.ipynb), where we looked at basic statistic about the dataset as well as the difference in terms of sales, top games across different regions.

### Related work

We are new to exploring this dataset. Prior analyses on this dataset have involved static analyses and basic graphs to track sales trends over the years. Our approach aims to be unique in that we will create interactive and visually appealing graphs. For instance, we plan to include a world map where users can click on a specific region to access information on top video games and observe differences in regional preferences through visual representations of these games. Additionally, we are considering extending our analysis to focus on specific franchises in order to gain more detailed insights.

## Milestone 2 (7th May, 5pm)

**10% of the final grade**

Our website is deployed on GitHub pages and can be accessed [here](https://com-480-data-visualization.github.io/project-2023-wizard-s-first-rule/).\
The pdf presenting the main ideas can be found [here](./milestone2.pdf) 

## Milestone 3 (4th June, 5pm)

**80% of the final grade**
Our website is deployed on GitHub pages and can be accessed [here](https://com-480-data-visualization.github.io/project-2023-wizard-s-first-rule/).\
The process book can be found [here](./processbook.pdf)
The video can be found [here](https://www.youtube.com/watch?v=KQPSHYlH8P0)

This the general structure of our repo:
```
.
├── README.md <-- current file
├── index.html <-- file to display our website
├── vg_sales.ipynb <-- notebook to explore the dataset
├── format_data_for_sankey.ipynb <-- notebook to format the data for the sankey diagram
├── datasets/ <-- Our datasets
└── assets/ <-- contains scripts, style, images for the website
    ├── css/ <-- stylesheet
    ├── img/ <-- images for the website
    └── js/ <-- scripts for visualisation
```


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

